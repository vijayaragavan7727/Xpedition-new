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
 *                       canvas.START_AI_CONVERSATION  (records the caller as owner)
 *                       canvas.POST_AI_MESSAGE        (caller must own conversationId)
 *                       miro.OPEN_WORKSPACE           (returns the configured, sanitized URL)
 *                     Everything else is 403. There is no OpenMAIC/LiveGenie learner action.
 *
 * Canvas note: the adapter uses one server token for the whole course, so Canvas
 * itself cannot tell learners apart. Ownership of each conversation is therefore
 * enforced HERE, and fails closed if the ownership record cannot be found.
 */

import type { ClassroomProvider } from './ClassroomProvider';
import type { ClassroomIntegrationId, ClassroomScene, ClassroomSceneRequest } from './types';
import { sanitizeExternalUrl } from './urlSecurity';
import { resolveClassLesson } from '../../concepts/lessonResolver';
import { resolveStepStage } from '../classStage';
import { getCacheAdapter } from '../../cache/cacheAdapter';

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

/** Records which learner owns an external resource (e.g. a Canvas conversation). */
export interface IntegrationOwnershipStore {
  recordOwner(provider: ClassroomIntegrationId, resourceId: string, userId: string): Promise<void>;
  ownerOf(provider: ClassroomIntegrationId, resourceId: string): Promise<string | null>;
}

export class CacheBackedOwnershipStore implements IntegrationOwnershipStore {
  private key(provider: string, resourceId: string) {
    return `integration:owner:${provider}:${resourceId}`;
  }
  async recordOwner(provider: ClassroomIntegrationId, resourceId: string, userId: string): Promise<void> {
    await getCacheAdapter().set(this.key(provider, resourceId), userId, 12 * 3600);
  }
  async ownerOf(provider: ClassroomIntegrationId, resourceId: string): Promise<string | null> {
    const owner = await getCacheAdapter().get<string>(this.key(provider, resourceId));
    return typeof owner === 'string' ? owner : null;
  }
}

export class InMemoryOwnershipStore implements IntegrationOwnershipStore {
  private readonly owners = new Map<string, string>();
  async recordOwner(provider: ClassroomIntegrationId, resourceId: string, userId: string): Promise<void> {
    this.owners.set(`${provider}:${resourceId}`, userId);
  }
  async ownerOf(provider: ClassroomIntegrationId, resourceId: string): Promise<string | null> {
    return this.owners.get(`${provider}:${resourceId}`) ?? null;
  }
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
  ownership: IntegrationOwnershipStore;
}): Promise<IntegrationResponse> {
  const { method, user, body, registry, ownership } = args;

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

    if (providerId === 'canvas' && actionType === 'POST_AI_MESSAGE') {
      const conversationId = String(actionPayload.conversationId ?? '');
      if (!conversationId) return fail(400, 'INVALID_REQUEST', 'conversationId is required');
      const owner = await ownership.ownerOf('canvas', conversationId);
      // Fail closed: unknown ownership is treated exactly like someone else's conversation.
      if (!owner || owner !== user.id) {
        return fail(404, 'NOT_FOUND', 'Conversation not found');
      }
    }

    const result = await provider.executeAction?.({
      type: actionType,
      payload: providerId === 'canvas' && actionType === 'POST_AI_MESSAGE'
        ? { conversationId: String(actionPayload.conversationId), message: String(actionPayload.message ?? '').slice(0, 2000) }
        : {},
    });

    if (result?.ok && providerId === 'canvas' && actionType === 'START_AI_CONVERSATION') {
      const conversationId = isRecord(result.payload) && result.payload.id !== undefined ? String(result.payload.id) : '';
      if (conversationId) await ownership.recordOwner('canvas', conversationId, user.id);
    }

    const safePayload = isRecord(result?.payload) ? { ...result!.payload } : undefined;
    if (safePayload && typeof safePayload.url === 'string') {
      safePayload.url = sanitizeExternalUrl(safePayload.url) || '';
    }
    return {
      status: 200,
      body: { success: Boolean(result?.ok), result: result ? { ok: result.ok, provider: result.provider, payload: safePayload } : null },
    };
  } catch {
    // Never leak provider/internal error text to the client.
    return fail(502, 'PROVIDER_ERROR', 'Classroom integration request failed');
  }
}
