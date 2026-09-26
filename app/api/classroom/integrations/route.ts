import { NextRequest, NextResponse } from 'next/server';
import { classroomIntegrationRegistry } from '@/lib/classroom/integrations';
import { sanitizeExternalUrl } from '@/lib/classroom/integrations/urlSecurity';
import type {
  ClassroomAction,
  ClassroomIntegrationContext,
  ClassroomIntegrationId,
  ClassroomScene,
  ClassroomSceneRequest,
} from '@/lib/classroom/integrations';

const ALLOWED_PROVIDERS = new Set<ClassroomIntegrationId>(['openmaic', 'livegenie', 'canvas', 'miro']);
const ALLOWED_ACTIONS = new Set(['generate_scene', 'execute_action']);

export async function GET() {
  return NextResponse.json({
    success: true,
    contractVersion: 1,
    providers: classroomIntegrationRegistry.statuses(),
  });
}

export async function POST(request: NextRequest) {
  try {
    let body: {
      action?: string;
      provider?: string;
      context?: ClassroomIntegrationContext;
      sceneRequest?: ClassroomSceneRequest;
      providerAction?: ClassroomAction;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Malformed JSON payload' }, { status: 400 });
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }

    const { provider: rawProvider, action: rawAction } = body;

    if (!rawProvider || typeof rawProvider !== 'string' || !rawAction || typeof rawAction !== 'string') {
      return NextResponse.json({ success: false, error: 'provider and action are required' }, { status: 400 });
    }

    const providerId = rawProvider.toLowerCase().trim() as ClassroomIntegrationId;
    const action = rawAction.toLowerCase().trim();

    if (!ALLOWED_PROVIDERS.has(providerId) || !ALLOWED_ACTIONS.has(action)) {
      return NextResponse.json({ success: false, error: 'Unsupported provider or action' }, { status: 400 });
    }

    const provider = classroomIntegrationRegistry.get(providerId);
    if (!provider) {
      return NextResponse.json({ success: false, error: 'Unknown classroom provider' }, { status: 404 });
    }

    if (action === 'generate_scene') {
      if (!body.sceneRequest && !body.context) {
        return NextResponse.json({ success: false, error: 'context or sceneRequest is required' }, { status: 400 });
      }

      const requestPayload = body.sceneRequest || {
        ...(body.context as ClassroomIntegrationContext),
        purpose: 'visualize',
      };

      const scene = await provider.generateScene?.(requestPayload);

      // Deep security validation on returned scene before passing to client
      let safeScene: ClassroomScene | null = null;
      if (scene) {
        const safeExternalUrl = scene.externalUrl
          ? sanitizeExternalUrl(scene.externalUrl)
          : undefined;

        safeScene = {
          provider: scene.provider,
          kind: scene.kind,
          title: String(scene.title || '').slice(0, 200),
          description: scene.description ? String(scene.description).slice(0, 1000) : undefined,
          payload: scene.payload,
          externalUrl: safeExternalUrl || undefined,
        };
      }

      return NextResponse.json({ success: true, scene: safeScene, provider: provider.status() });
    }

    if (!body.providerAction || typeof body.providerAction !== 'object' || !body.providerAction.type) {
      return NextResponse.json({ success: false, error: 'providerAction is required' }, { status: 400 });
    }

    const result = await provider.executeAction?.(body.providerAction);

    // Sanitize any URL in action result payload
    if (result?.payload?.url && typeof result.payload.url === 'string') {
      const sanitized = sanitizeExternalUrl(result.payload.url);
      result.payload.url = sanitized || '';
    }

    return NextResponse.json({
      success: Boolean(result?.ok),
      result: result || null,
      provider: provider.status(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Classroom integration request failed';
    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }
}
