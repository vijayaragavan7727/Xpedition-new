import type { ClassroomProvider } from './ClassroomProvider';
import { sanitizeExternalUrl } from './urlSecurity';
import { boundedTimeoutMs, fetchJsonWithTimeout } from '../../security/fetchWithTimeout';
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
/** Default hard deadline for one bridge exchange (headers + body). */
// Below the Class client deadline (3000 ms) so the server always finishes first.
export const OPENMAIC_DEFAULT_TIMEOUT_MS = 2500;

export interface OpenMAICProviderOptions {
  bridgeUrl?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export class OpenMAICProvider implements ClassroomProvider {
  readonly id = 'openmaic' as const;
  readonly label = 'OpenMAIC';

  private readonly bridgeUrl: string;
  /** Bounded server-side deadline (XPEDITION_OPENMAIC_TIMEOUT_MS, clamped). */
  readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch | undefined;

  constructor(options: OpenMAICProviderOptions = {}) {
    this.bridgeUrl = (options.bridgeUrl ?? process.env.XPEDITION_OPENMAIC_BRIDGE_URL ?? '').trim();
    this.timeoutMs = boundedTimeoutMs(options.timeoutMs ?? process.env.XPEDITION_OPENMAIC_TIMEOUT_MS, OPENMAIC_DEFAULT_TIMEOUT_MS);
    this.fetchImpl = options.fetchImpl;
  }

  private post<T>(path: string, body: unknown) {
    return fetchJsonWithTimeout<T>(
      'OpenMAIC bridge',
      `${this.bridgeUrl.replace(/\/$/, '')}${path}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        cache: 'no-store',
      },
      this.timeoutMs,
      this.fetchImpl
    );
  }

  status(): ClassroomProviderStatus {
    return {
      id: this.id,
      label: this.label,
      // Not configured ≠ available: report honestly so the Class does not call it.
      status: this.bridgeUrl ? 'configured' : 'unavailable',
      reason: this.bridgeUrl
        ? 'OpenMAIC bridge configured (not verified by Xpedition until a scene succeeds).'
        : 'OpenMAIC bridge is not configured (XPEDITION_OPENMAIC_BRIDGE_URL unset). The native Class runs without it.',
      capabilities: ['scene', 'interactive', 'whiteboard', 'simulation', 'playback'],
    };
  }

  async initialize(_context: ClassroomIntegrationContext): Promise<void> {
    // The adapter is intentionally lazy. No external process is started from the
    // browser and no secret is exposed to the client.
  }

  async generateScene(request: ClassroomSceneRequest): Promise<ClassroomScene | null> {
    if (!this.bridgeUrl) return null;

    // Hard deadline: throws UpstreamTimeoutError (aborted) instead of hanging.
    const response = await this.post<Partial<ClassroomScene>>('/scene', {
      source: 'xpedition',
      contractVersion: 1,
      request,
    });

    if (!response.ok) {
      throw new Error(`OpenMAIC bridge returned HTTP ${response.status}`);
    }

    const data = response.data;
    if (!data || !data.title || data.provider !== 'openmaic') {
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

    const response = await this.post<Record<string, unknown>>('/action', { source: 'xpedition', contractVersion: 1, action });

    if (!response.ok) {
      return { ok: false, provider: this.id, message: `OpenMAIC bridge returned HTTP ${response.status}` };
    }

    return { ok: true, provider: this.id, payload: response.data ?? {} };
  }
}
