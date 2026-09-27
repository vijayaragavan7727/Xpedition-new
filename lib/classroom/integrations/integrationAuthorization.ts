/**
 * Integration authorization & request handling (server-side, pure).
 *
 * Every integration request needs an authenticated learner. The route resolves
 * identity with `requireServerAuth` and passes it in; this module never trusts
 * a user id from the request body.
 *
 * Policy (learner-triggered):
 *   generate_scene  → allowed for enabled providers; the scene context is rebuilt
 *                     SERVER-SIDE from the canonical lesson (client lesson text is
 *                     never forwarded to an external provider).
 *   execute_action  → only explicitly allow-listed action types:
 *                       canvas.START_AI_CONVERSATION  (returns a signed, learner-bound conversationHandle)
 *                       canvas.POST_AI_MESSAGE        (requires a conversationHandle bound to the caller)
 *                       miro.OPEN_WORKSPACE           (returns the configured, sanitized URL)
 *                     Everything else is 403. There is no OpenMAIC/LiveGenie learner action.
 *
 * Canvas credential boundary:
 *
 *   Xpedition identity (Supabase session)
 *     → Xpedition authorization (this module: allow-list + learner-bound handles)
 *       → server-side Canvas school credential (CanvasProvider, never sent to the browser)
 *         → allowed Canvas action
 *
 * Xpedition learner identity is NOT equivalent to a per-user Canvas identity. The
 * adapter uses one school token, so Canvas itself cannot tell learners apart.
 * Raw Canvas conversation ids are never accepted from the client: START returns
 * an HMAC-signed handle bound to the learner, and POST verifies it (fails closed).
 * Canvas response bodies are projected to a minimal shape before leaving the server.
 */

import type { ClassroomProvider } from './ClassroomProvider';
import type { ClassroomIntegrationId, ClassroomScene, ClassroomSceneRequest } from './types';
import { sanitizeExternalUrl } from './urlSecurity';
import { resolveClassLesson } from '../../concepts/lessonResolver';
import { resolveStepStage } from '../classStage';
import type { ResourceHandleSigner } from '../../security/resourceHandle';
import { UpstreamTimeoutError } from '../../security/fetchWithTimeout';

export const INTEGRATION_MAX_BODY_BYTES = 16 * 1024;
const ALLOWED_PROVIDERS = new Set<ClassroomIntegrationId>(['openmaic', 'livegenie', 'canvas', 'miro']);
const ALLOWED_ACTIONS = new Set(['generate_scene', 'execute_action']);

const LEARNER_ACTIONS: Partial<Record<ClassroomIntegrationId, Set<string>>> = {
  canvas: new Set(['START_AI_CONVERSATION', 'POST_AI_MESSAGE']),
  miro: new Set(['OPEN_WORKSPACE']),
};

const PURPOSES = new Set(['teach', 'visualize', 'interact', 'practice', 'challenge']);

export interface AuthenticatedLearner {
  id: string;
}

export interface ProviderLookup {
  get(id: ClassroomIntegrationId): ClassroomProvider | undefined;
  all(): ClassroomProvider[];
}

/**
 * Canvas bodies are made with the school credential and may carry Canvas-side
 * identifiers (users, courses, SIS ids). Only message content survives; any key
 * that names a user/account/credential identifier is removed recursively.
 */
const CANVAS_SENSITIVE_KEY = /(user|author|account|login|email|sis|token|course|enrollment|workflow_state|_id$|^id$)/i;
export function projectCanvasPayload(payload: unknown, depth = 0): Record<string, unknown> | undefined {
  if (!isRecord(payload) || depth > 4) return undefined;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (CANVAS_SENSITIVE_KEY.test(key)) continue;
    if (Array.isArray(value)) {
      out[key] = value.slice(0, 50).map((v) => (isRecord(v) ? projectCanvasPayload(v, depth + 1) : typeof v === 'string' ? v.slice(0, 4000) : v));
    } else if (isRecord(value)) {
      out[key] = projectCanvasPayload(value, depth + 1);
    } else {
      out[key] = typeof value === 'string' ? value.slice(0, 4000) : value;
    }
  }
  return out;
}

export interface IntegrationResponse {
  status: number;
  body: Record<string, unknown>;
}

const fail = (status: number, code: string, error: string): IntegrationResponse => ({
  status,
  body: { success: false, code, error },
});

/** Public status view: no reasons/env names, just what the Class needs. */
export function publicProviderStatuses(registry: ProviderLookup) {
  return registry.all().map((p) => {
    const s = p.status();
    return { id: s.id, label: s.label, status: s.status, capabilities: s.capabilities };
  });
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Builds the scene request from the canonical lesson. Only conceptId, stepIndex
 * and purpose are taken from the client.
 */
export function buildServerSceneRequest(input: unknown): ClassroomSceneRequest | null {
  if (!isRecord(input)) return null;
  const resolution = resolveClassLesson(input.conceptId);
  if (resolution.status !== 'resolved') return null;
  const lesson = resolution.lesson;
  const rawIndex = Number(input.stepIndex);
  if (!Number.isInteger(rawIndex) || rawIndex < 0 || rawIndex >= lesson.steps.length) return null;
  const step = lesson.steps[rawIndex];
  const purpose = typeof input.purpose === 'string' && PURPOSES.has(input.purpose) ? input.purpose : 'visualize';
  const stage = resolveStepStage(step, rawIndex, lesson.steps.length);
  const stageMap = { introduce: 'INTRO', explain: 'EXPLAIN', show: 'VISUALIZE', interact: 'INTERACT', question: 'QUESTION', practice: 'PRACTICE', challenge: 'PRACTICE', assess: 'PRACTICE', reward: 'REWARD' } as const;
  return {
    conceptId: resolution.conceptId,
    topicTitle: lesson.topicTitle,
    subject: lesson.subject,
    stage: stageMap[stage],
    stepIndex: rawIndex,
    lesson,
    step,
    purpose: purpose as ClassroomSceneRequest['purpose'],
  };
}

function sanitizeScene(scene: ClassroomScene | null | undefined, conceptId: string): Record<string, unknown> | null {
  if (!scene) return null;
  const payload = isRecord(scene.payload) ? scene.payload : undefined;
  return {
    provider: scene.provider,
    kind: scene.kind,
    title: String(scene.title || '').slice(0, 200),
    description: scene.description ? String(scene.description).slice(0, 1000) : undefined,
    // The Class identity-gates visuals again client-side; we tag the concept here.
    payload: payload ? { ...payload, requestedConceptId: conceptId } : undefined,
    externalUrl: scene.externalUrl ? sanitizeExternalUrl(scene.externalUrl) || undefined : undefined,
  };
}

export async function handleIntegrationRequest(args: {
  method: 'GET' | 'POST';
  user: AuthenticatedLearner | null;
  body?: unknown;
  registry: ProviderLookup;
  /** Signs/verifies learner-bound resource handles; null → handle-based actions fail closed. */
  handles: ResourceHandleSigner | null;
}): Promise<IntegrationResponse> {
  const { method, user, body, registry, handles } = args;

  // Defence in depth: the route already requires auth, but never proceed without a learner.
  if (!user || typeof user.id !== 'string' || !user.id) {
    return fail(401, 'UNAUTHENTICATED', 'Authentication required');
  }

  if (method === 'GET') {
    return { status: 200, body: { success: true, contractVersion: 1, providers: publicProviderStatuses(registry) } };
  }

  if (!isRecord(body)) return fail(400, 'INVALID_REQUEST', 'Invalid request body');
  const providerId = typeof body.provider === 'string' ? (body.provider.toLowerCase().trim() as ClassroomIntegrationId) : null;
  const action = typeof body.action === 'string' ? body.action.toLowerCase().trim() : null;
  if (!providerId || !action || !ALLOWED_PROVIDERS.has(providerId) || !ALLOWED_ACTIONS.has(action)) {
    return fail(400, 'UNSUPPORTED', 'Unsupported provider or action');
  }
  const provider = registry.get(providerId);
  if (!provider) return fail(404, 'UNKNOWN_PROVIDER', 'Unknown classroom provider');

  const status = provider.status().status;
  if (status !== 'configured') {
    return { status: 200, body: { success: true, scene: null, result: null, provider: { id: providerId, status } } };
  }

  try {
    if (action === 'generate_scene') {
      const sceneRequest = buildServerSceneRequest(body.context ?? body.sceneRequest);
      if (!sceneRequest) return fail(400, 'INVALID_CONTEXT', 'A valid canonical conceptId and stepIndex are required');
      const scene = await provider.generateScene?.(sceneRequest);
      return {
        status: 200,
        body: { success: true, scene: sanitizeScene(scene, sceneRequest.conceptId), provider: { id: providerId, status } },
      };
    }

    // execute_action
    const providerAction = isRecord(body.providerAction) ? body.providerAction : null;
    const actionType = providerAction && typeof providerAction.type === 'string' ? providerAction.type : '';
    if (!actionType) return fail(400, 'INVALID_REQUEST', 'providerAction.type is required');
    if (!LEARNER_ACTIONS[providerId]?.has(actionType)) {
      return fail(403, 'ACTION_NOT_PERMITTED', 'This integration action is not permitted for learners');
    }
    const actionPayload = isRecord(providerAction?.payload) ? providerAction!.payload : {};

    const isCanvasConversation = providerId === 'canvas';
    if (isCanvasConversation && !handles) {
      // No signing secret in production: Canvas conversations cannot be bound to a learner.
      return fail(503, 'INTEGRATION_NOT_CONFIGURED', 'Classroom integration is not available');
    }

    let conversationId = '';
    if (providerId === 'canvas' && actionType === 'POST_AI_MESSAGE') {
      // Never trust a raw conversation id (or any user id) from the client.
      const verified = handles!.verify(actionPayload.conversationHandle, { provider: 'canvas', userId: user.id });
      // Fail closed: forged, expired, re-targeted or another learner's handle all look "not found".
      if (!verified) return fail(404, 'NOT_FOUND', 'Conversation not found');
      conversationId = verified;
      const message = String(actionPayload.message ?? '').trim();
      if (!message) return fail(400, 'INVALID_REQUEST', 'message is required');
    }

    const result = await provider.executeAction?.({
      type: actionType,
      payload: conversationId
        ? { conversationId, message: String(actionPayload.message ?? '').trim().slice(0, 2000) }
        : {},
    });

    let safePayload: Record<string, unknown> | undefined;
    if (result?.ok && providerId === 'canvas' && actionType === 'START_AI_CONVERSATION') {
      const startedId = isRecord(result.payload) && result.payload.id !== undefined ? String(result.payload.id) : '';
      if (!startedId) return fail(502, 'PROVIDER_ERROR', 'Classroom integration request failed');
      // Only the learner-bound handle leaves the server; never the raw Canvas object.
      safePayload = { conversationHandle: handles!.sign({ provider: 'canvas', resourceId: startedId, userId: user.id }) };
    } else if (result?.ok && providerId === 'canvas') {
      safePayload = projectCanvasPayload(result.payload);
    } else if (isRecord(result?.payload)) {
      safePayload = { ...result!.payload };
      if (typeof safePayload.url === 'string') safePayload.url = sanitizeExternalUrl(safePayload.url) || '';
    }
    return {
      status: 200,
      body: { success: Boolean(result?.ok), result: result ? { ok: result.ok, provider: result.provider, payload: safePayload } : null },
    };
  } catch (err) {
    if (err instanceof UpstreamTimeoutError) {
      // Deterministic, bounded failure: the Class keeps its native visuals.
      return fail(504, 'PROVIDER_TIMEOUT', 'Classroom integration timed out');
    }
    // Never leak provider/internal error text to the client.
    return fail(502, 'PROVIDER_ERROR', 'Classroom integration request failed');
  }
}
