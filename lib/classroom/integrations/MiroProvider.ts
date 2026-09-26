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
 * Miro integration boundary.
 *
 * Miro supports Live Embed and a Web SDK. Xpedition keeps the Class shell intact
 * and exposes a workspace URL only when the founder configures one.
 */
export class MiroProvider implements ClassroomProvider {
  readonly id = 'miro' as const;
  readonly label = 'Miro';

  private readonly embedUrl = process.env.NEXT_PUBLIC_MIRO_EMBED_URL?.trim() || '';

  private getSanitizedUrl(): string | null {
    if (!this.embedUrl) return null;
    return sanitizeExternalUrl(this.embedUrl, { allowedDomains: ['miro.com', '*.miro.com'] });
  }

  status(): ClassroomProviderStatus {
    const safeUrl = this.getSanitizedUrl();
    return {
      id: this.id,
      label: this.label,
      status: safeUrl ? 'configured' : 'disabled',
      reason: safeUrl
        ? 'Miro workspace URL configured.'
        : 'Miro is optional; configure a Live Embed/workspace URL when ready.',
      capabilities: ['collaborative-board', 'sticky-notes', 'mindmap', 'workspace'],
    };
  }

  async initialize(_context: ClassroomIntegrationContext): Promise<void> {
    // No Miro SDK is loaded into the Xpedition page. A Live Embed/workspace is
    // opened only when explicitly requested.
  }

  async generateScene(request: ClassroomSceneRequest): Promise<ClassroomScene | null> {
    const safeUrl = this.getSanitizedUrl();
    if (!safeUrl) return null;
    return {
      provider: 'miro',
      kind: 'workspace',
      title: `${request.topicTitle} investigation workspace`,
      description: 'Collaborative workspace for investigation and evidence collection.',
      externalUrl: safeUrl,
      payload: { conceptId: request.conceptId },
    };
  }

  async executeAction(action: ClassroomAction): Promise<ClassroomActionResult> {
    if (action.type !== 'OPEN_WORKSPACE') {
      return { ok: false, provider: this.id, message: `Unsupported Miro action: ${action.type}` };
    }
    const safeUrl = this.getSanitizedUrl();
    if (!safeUrl) {
      return { ok: false, provider: this.id, message: 'Miro workspace URL is not configured or failed security validation.' };
    }
    return { ok: true, provider: this.id, payload: { url: safeUrl } };
  }
}
