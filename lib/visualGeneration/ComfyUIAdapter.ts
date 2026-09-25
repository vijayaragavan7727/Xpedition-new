/**
 * Xpedition Visual Intelligence — ComfyUI Server Adapter
 *
 * Dedicated server-side adapter for communicating with a local or private
 * ComfyUI instance. Handles REST endpoints, WebSocket/polling execution monitoring,
 * and image payload retrieval.
 *
 * NOTE: This adapter is strictly server-side. Never invoke from client components.
 */

import {
  ComfyUIPromptResponse,
  ComfyUIHistoryResponse,
  ComfyUIHistoryItem,
  ComfyUISystemStats,
} from './types';
import {
  ComfyUIUnavailableError,
  ComfyUITimeoutError,
  ComfyUIWorkflowRejectedError,
  VisualGenerationError,
} from './errors';

export interface ComfyUIAdapterConfig {
  baseUrl?: string;                      // e.g. "http://127.0.0.1:8188"
  timeoutMs?: number;                    // e.g. 180000 (3 min default for CPU generation)
  pollIntervalMs?: number;               // e.g. 1000
}

export class ComfyUIAdapter {
  private readonly baseUrl: string;
  private readonly defaultTimeoutMs: number;
  private readonly pollIntervalMs: number;

  constructor(config: ComfyUIAdapterConfig = {}) {
    const rawUrl =
      config.baseUrl ||
      process.env.COMFYUI_BASE_URL ||
      'http://127.0.0.1:8188';

    // Normalize URL (strip trailing slash)
    this.baseUrl = rawUrl.replace(/\/+$/, '');
    this.defaultTimeoutMs = config.timeoutMs ?? (Number(process.env.COMFYUI_TIMEOUT_MS) || 600000);
    this.pollIntervalMs = config.pollIntervalMs ?? 1000;
  }

  /**
   * Returns configured base URL for internal logging (never expose to client)
   */
  public getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Healthcheck to verify local ComfyUI connectivity
   */
  public async isHealthy(): Promise<{ ok: boolean; stats?: ComfyUISystemStats; error?: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`${this.baseUrl}/system_stats`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        return { ok: false, error: `HTTP ${res.status}: ${res.statusText}` };
      }

      const stats = (await res.json()) as ComfyUISystemStats;
      return { ok: true, stats };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Connection refused' };
    }
  }

  /**
   * Submits a workflow node graph to ComfyUI
   * Endpoint: POST /prompt
   */
  public async submitWorkflow(
    workflowPrompt: Record<string, any>,
    clientId = 'xpedition-server'
  ): Promise<ComfyUIPromptResponse> {
    try {
      const res = await fetch(`${this.baseUrl}/prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          prompt: workflowPrompt,
          client_id: clientId,
        }),
      });

      if (!res.ok) {
        let errorData: any = {};
        try {
          errorData = await res.json();
        } catch {}

        if (res.status === 400 || errorData.node_errors) {
          throw new ComfyUIWorkflowRejectedError(errorData.node_errors || errorData);
        }

        throw new VisualGenerationError(
          'COMFYUI_WORKFLOW_REJECTED',
          `ComfyUI POST /prompt failed with status ${res.status}: ${JSON.stringify(errorData)}`,
          'Workflow submission was rejected by the generation engine.',
          res.status,
          errorData
        );
      }

      const data = (await res.json()) as ComfyUIPromptResponse;

      if (data.node_errors && Object.keys(data.node_errors).length > 0) {
        throw new ComfyUIWorkflowRejectedError(data.node_errors);
      }

      return data;
    } catch (err: any) {
      if (err instanceof VisualGenerationError) throw err;
      if (err.name === 'TypeError' || err.code === 'ECONNREFUSED') {
        throw new ComfyUIUnavailableError(`Cannot connect to ComfyUI at ${this.baseUrl}: ${err.message}`);
      }
      throw new VisualGenerationError(
        'UNKNOWN_ERROR',
        `Unexpected error submitting prompt: ${err.message}`,
        'Could not submit generation task.',
        500
      );
    }
  }

  /**
   * Polls execution history until the prompt completes or times out
   * Endpoint: GET /history/{prompt_id}
   */
  public async waitForCompletion(
    promptId: string,
    timeoutMs?: number
  ): Promise<ComfyUIHistoryItem> {
    const maxTimeout = timeoutMs ?? this.defaultTimeoutMs;
    const startTime = Date.now();

    while (Date.now() - startTime < maxTimeout) {
      try {
        const history = await this.getHistory(promptId);
        if (history && history[promptId]) {
          const item = history[promptId];

          // Check if images or output was produced
          const outputs = item.outputs || {};
          const hasImages = Object.values(outputs).some(
            (out) => Array.isArray(out.images) && out.images.length > 0
          );

          if (hasImages || item.status?.completed) {
            return item;
          }
        }
      } catch (err: any) {
        // If connection is dropped intermittently during generation, continue polling until timeout
      }

      await new Promise((resolve) => setTimeout(resolve, this.pollIntervalMs));
    }

    throw new ComfyUITimeoutError(maxTimeout);
  }

  /**
   * Fetches history for a specific prompt ID
   * Endpoint: GET /history/{prompt_id}
   */
  public async getHistory(promptId: string): Promise<ComfyUIHistoryResponse> {
    try {
      const res = await fetch(`${this.baseUrl}/history/${encodeURIComponent(promptId)}`, {
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`GET /history failed with status ${res.status}`);
      }

      return (await res.json()) as ComfyUIHistoryResponse;
    } catch (err: any) {
      if (err.code === 'ECONNREFUSED') {
        throw new ComfyUIUnavailableError(`Cannot connect to ComfyUI at ${this.baseUrl}`);
      }
      throw err;
    }
  }

  /**
   * Fetches binary image buffer from ComfyUI view endpoint
   * Endpoint: GET /view?filename=...&subfolder=...&type=...
   */
  public async fetchImageBuffer(
    filename: string,
    subfolder = '',
    type = 'output'
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    const params = new URLSearchParams({
      filename,
      subfolder,
      type,
    });

    try {
      const res = await fetch(`${this.baseUrl}/view?${params.toString()}`);

      if (!res.ok) {
        throw new VisualGenerationError(
          'COMFYUI_NO_OUTPUT',
          `GET /view returned status ${res.status} for ${filename}`,
          'Could not retrieve generated visual output.',
          res.status
        );
      }

      const mimeType = res.headers.get('content-type') || 'image/png';
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      return { buffer, mimeType };
    } catch (err: any) {
      if (err instanceof VisualGenerationError) throw err;
      throw new ComfyUIUnavailableError(`Failed to fetch image from ComfyUI: ${err.message}`);
    }
  }

  /**
   * Interrupts currently executing prompt if running
   * Endpoint: POST /interrupt
   */
  public async interruptExecution(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/interrupt`, { method: 'POST' });
      return res.ok;
    } catch {
      return false;
    }
  }
}

export default ComfyUIAdapter;
