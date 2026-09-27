import type { ClassroomProvider } from './ClassroomProvider';
import type {
  ClassroomAction,
  ClassroomActionResult,
  ClassroomIntegrationContext,
  ClassroomProviderStatus,
  ClassroomScene,
  ClassroomSceneRequest,
} from './types';
import { boundedTimeoutMs, fetchJsonWithTimeout, type BoundedResponse } from '../../security/fetchWithTimeout';

export const CANVAS_DEFAULT_TIMEOUT_MS = 8000;

/**
 * Canvas REST adapter for AI Experiences / AI Conversations.
 *
 * CREDENTIAL BOUNDARY: this adapter holds ONE school-wide Canvas credential
 * (CANVAS_API_TOKEN). It is server-side only and never reaches the browser.
 * Xpedition learner identity is NOT equivalent to a per-user Canvas identity:
 * every Canvas call is made as the school credential, on behalf of an
 * authenticated Xpedition learner that Xpedition itself has authorized
 * (see integrationAuthorization.ts). There is no per-student Canvas OAuth.
 */
export class CanvasProvider implements ClassroomProvider {
  readonly id = 'canvas' as const;
  readonly label = 'Canvas';

  private readonly baseUrl = process.env.CANVAS_BASE_URL?.replace(/\/$/, '') || '';
  private readonly token = process.env.CANVAS_API_TOKEN?.trim() || '';
  private readonly courseId = process.env.CANVAS_COURSE_ID?.trim() || '';
  private readonly experienceId = process.env.CANVAS_AI_EXPERIENCE_ID?.trim() || '';

  status(): ClassroomProviderStatus {
    const configured = Boolean(this.baseUrl && this.token && this.courseId);
    return {
      id: this.id,
      label: this.label,
      status: configured ? 'configured' : 'disabled',
      reason: configured
        ? 'Canvas REST credentials and course context are configured.'
        : 'Canvas is optional and requires OAuth/API configuration plus a course id.',
      capabilities: ['ai-experiences', 'ai-conversations', 'course-context'],
    };
  }

  /** Bounded server-side deadline for each Canvas call (CANVAS_TIMEOUT_MS, clamped). */
  readonly timeoutMs = boundedTimeoutMs(process.env.CANVAS_TIMEOUT_MS, CANVAS_DEFAULT_TIMEOUT_MS);

  private async request<T = unknown>(path: string, init: RequestInit = {}): Promise<BoundedResponse<T>> {
    if (!this.baseUrl || !this.token) throw new Error('Canvas integration is not configured.');
    return fetchJsonWithTimeout<T>(
      'Canvas',
      `${this.baseUrl}${path}`,
      {
        ...init,
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: 'application/json',
          ...(init.headers || {}),
        },
        cache: 'no-store',
      },
      this.timeoutMs
    );
  }

  async initialize(_context: ClassroomIntegrationContext): Promise<void> {
    // Canvas is intentionally lazy; the class does not call Canvas until a Canvas
    // activity is requested.
  }

  async generateScene(request: ClassroomSceneRequest): Promise<ClassroomScene | null> {
    if (!this.baseUrl || !this.token || !this.courseId || !this.experienceId) return null;

    const response = await this.request<{
      id: number;
      title: string;
      description?: string;
      learning_objective?: string;
    }>(`/api/v1/courses/${encodeURIComponent(this.courseId)}/ai_experiences/${encodeURIComponent(this.experienceId)}`);
    if (!response.ok || !response.data) throw new Error(`Canvas AI Experience returned HTTP ${response.status}`);

    const experience = response.data;

    return {
      provider: 'canvas',
      kind: 'activity',
      title: experience.title || request.topicTitle,
      description: experience.description || experience.learning_objective,
      payload: { experienceId: experience.id, courseId: this.courseId },
    };
  }

  async executeAction(action: ClassroomAction): Promise<ClassroomActionResult> {
    if (!this.baseUrl || !this.token || !this.courseId || !this.experienceId) {
      return { ok: false, provider: this.id, message: 'Canvas integration is not configured.' };
    }

    if (action.type !== 'START_AI_CONVERSATION' && action.type !== 'POST_AI_MESSAGE') {
      return { ok: false, provider: this.id, message: `Unsupported Canvas action: ${action.type}` };
    }

    if (action.type === 'START_AI_CONVERSATION') {
      const response = await this.request(
        `/api/v1/courses/${encodeURIComponent(this.courseId)}/ai_experiences/${encodeURIComponent(this.experienceId)}/conversations`,
        { method: 'POST' }
      );
      if (!response.ok) return { ok: false, provider: this.id, message: `Canvas conversation returned HTTP ${response.status}` };
      return { ok: true, provider: this.id, payload: (response.data ?? {}) as Record<string, unknown> };
    }

    const conversationId = String(action.payload?.conversationId || '');
    const message = String(action.payload?.message || '').trim();
    if (!conversationId || !message) {
      return { ok: false, provider: this.id, message: 'Canvas conversationId and message are required.' };
    }

    const body = new URLSearchParams({ message });
    const response = await this.request(
      `/api/v1/courses/${encodeURIComponent(this.courseId)}/ai_experiences/${encodeURIComponent(this.experienceId)}/conversations/${encodeURIComponent(conversationId)}/messages`,
      { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body }
    );
    if (!response.ok) return { ok: false, provider: this.id, message: `Canvas message returned HTTP ${response.status}` };
    return { ok: true, provider: this.id, payload: (response.data ?? {}) as Record<string, unknown> };
  }
}
