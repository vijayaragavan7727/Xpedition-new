import type { ClassroomProvider } from './ClassroomProvider';
import type {
  ClassroomAction,
  ClassroomActionResult,
  ClassroomIntegrationContext,
  ClassroomProviderStatus,
  ClassroomScene,
  ClassroomSceneRequest,
} from './types';

/**
 * LiveGenie capability boundary.
 *
 * LiveGenie's public site describes multimodal tutoring, real-time visuals,
 * assessments, games and interactives. No public API/SDK contract is assumed
 * here. This provider therefore stays disabled until an official integration
 * endpoint/credential is supplied by LiveGenie.
 */
export class LiveGenieProvider implements ClassroomProvider {
  readonly id = 'livegenie' as const;
  readonly label = 'LiveGenie';

  private readonly endpoint = process.env.LIVEGENIE_API_BASE_URL?.trim() || '';
  private readonly apiKey = process.env.LIVEGENIE_API_KEY?.trim() || '';

  status(): ClassroomProviderStatus {
    const configured = Boolean(this.endpoint && this.apiKey);
    return {
      id: this.id,
      label: this.label,
      status: configured ? 'configured' : 'unavailable',
      reason: configured
        ? 'LiveGenie integration credentials are configured; endpoint usage remains adapter-driven.'
        : 'No public LiveGenie API/SDK contract is assumed. Configure an official integration when provided.',
      capabilities: ['multimodal-tutoring', 'visuals', 'assessments', 'games', 'interactives'],
    };
  }

  async initialize(_context: ClassroomIntegrationContext): Promise<void> {
    // Intentionally no-op until an official LiveGenie API contract is configured.
  }

  async generateScene(_request: ClassroomSceneRequest): Promise<ClassroomScene | null> {
    return null;
  }

  async executeAction(_action: ClassroomAction): Promise<ClassroomActionResult> {
    return {
      ok: false,
      provider: this.id,
      message: 'LiveGenie provider is intentionally inactive until an official API/SDK contract is configured.',
    };
  }
}
