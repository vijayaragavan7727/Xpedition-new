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
 * Canvas REST adapter for AI Experiences / AI Conversations.
 *
 * The token is server-side only. No Canvas credential is exposed to the browser.
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

  private async request(path: string, init: RequestInit = {}): Promise<Response> {
    if (!this.baseUrl || !this.token) throw new Error('Canvas integration is not configured.');
    return fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/json',
        ...(init.headers || {}),
      },
      cache: 'no-store',
    });
  }

  async initialize(_context: ClassroomIntegrationContext): Promise<void> {
    // Canvas is intentionally lazy; the class does not call Canvas until a Canvas
    // activity is requested.
  }

  async generateScene(request: ClassroomSceneRequest): Promise<ClassroomScene | null> {
    if (!this.baseUrl || !this.token || !this.courseId || !this.experienceId) return null;

    const response = await this.request(
      `/api/v1/courses/${encodeURIComponent(this.courseId)}/ai_experiences/${encodeURIComponent(this.experienceId)}`
    );
    if (!response.ok) throw new Error(`Canvas AI Experience returned HTTP ${response.status}`);

    const experience = (await response.json()) as {
      id: number;
      title: string;
      description?: string;
      learning_objective?: string;
    };

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
      return { ok: true, provider: this.id, payload: await response.json() };
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
    return { ok: true, provider: this.id, payload: await response.json() };
  }
}
