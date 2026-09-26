import type { ClassroomProvider } from './ClassroomProvider';
import { sanitizeExternalUrl } from './urlSecurity';
import type {
  ClassroomAction,
  ClassroomActionResult,
  ClassroomIntegrationContext,
  ClassroomProviderStatus,
  ClassroomScene,
  ClassroomSceneRequest,
} from './types';

/**
 * OpenMAIC adapter boundary.
 *
 * OpenMAIC publishes @openmaic/* SDK packages, but Xpedition intentionally does
 * not hard-depend on OpenMAIC packages here. The Class must remain runnable when
 * the external runtime is absent. A separately hosted OpenMAIC bridge can be
 * connected through XPEDITION_OPENMAIC_BRIDGE_URL without changing the Class UI.
 */
export class OpenMAICProvider implements ClassroomProvider {
  readonly id = 'openmaic' as const;
  readonly label = 'OpenMAIC';

  private readonly bridgeUrl = process.env.XPEDITION_OPENMAIC_BRIDGE_URL?.trim() || '';

  status(): ClassroomProviderStatus {
    return {
      id: this.id,
      label: this.label,
      status: this.bridgeUrl ? 'configured' : 'available',
      reason: this.bridgeUrl
        ? 'OpenMAIC bridge configured.'
        : 'OpenMAIC SDK/bridge is optional; Xpedition native classroom remains the fallback.',
      capabilities: ['scene', 'interactive', 'whiteboard', 'simulation', 'playback'],
    };
  }

  async initialize(_context: ClassroomIntegrationContext): Promise<void> {
    // The adapter is intentionally lazy. No external process is started from the
    // browser and no secret is exposed to the client.
  }

  async generateScene(request: ClassroomSceneRequest): Promise<ClassroomScene | null> {
    if (!this.bridgeUrl) return null;

    const response = await fetch(`${this.bridgeUrl.replace(/\/$/, '')}/scene`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'xpedition',
        contractVersion: 1,
        request,
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`OpenMAIC bridge returned HTTP ${response.status}`);
    }

    const data = (await response.json()) as Partial<ClassroomScene>;
    if (!data.title || data.provider !== 'openmaic') {
      throw new Error('OpenMAIC bridge returned an invalid scene contract.');
    }

    const sanitizedUrl = data.externalUrl ? sanitizeExternalUrl(data.externalUrl) : undefined;

    return {
      provider: 'openmaic',
      kind: data.kind || 'scene',
      title: data.title,
      description: data.description,
      payload: data.payload,
      externalUrl: sanitizedUrl || undefined,
    };
  }

  async executeAction(action: ClassroomAction): Promise<ClassroomActionResult> {
    if (!this.bridgeUrl) {
      return { ok: false, provider: this.id, message: 'OpenMAIC bridge is not configured.' };
    }

    const response = await fetch(`${this.bridgeUrl.replace(/\/$/, '')}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'xpedition', contractVersion: 1, action }),
      cache: 'no-store',
    });

    if (!response.ok) {
      return { ok: false, provider: this.id, message: `OpenMAIC bridge returned HTTP ${response.status}` };
    }

    const payload = (await response.json()) as Record<string, unknown>;
    return { ok: true, provider: this.id, payload };
  }
}
