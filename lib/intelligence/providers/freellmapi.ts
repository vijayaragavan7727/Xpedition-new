/**
 * Xpedition Intelligence Layer v1 — FreeLLMAPI Gateway Provider
 *
 * Optional proxy provider connecting Xpedition to a FreeLLMAPI router instance.
 * Treats FreeLLMAPI as an external routing gateway across free tier models.
 *
 * Guarantees:
 * 1. Never exposed directly to the browser (server-side only).
 * 2. Optional and non-blocking (system operates with 100% functionality without it).
 * 3. Gracefully catches 429/5xx and triggers canonical fallback.
 */

import { BaseProvider } from './base';
import {
  Capability,
  ProviderExecutionRequest,
  ProviderExecutionResult,
  ProviderId,
  ProviderPolicy,
} from '../types';

export class FreeLLMAPIProvider extends BaseProvider {
  readonly providerId: ProviderId = 'freellmapi';
  readonly envKeyName: string = 'FREE_LLM_API_KEY';
  readonly isPaidProvider: boolean = false; // Free aggregation gateway

  readonly defaultPolicy: ProviderPolicy = {
    providerId: 'freellmapi',
    costTier: 'free_tier',
    latencyTier: 'fast',
    qualityTier: 'high',
    priority: 2, // Sits between direct Groq (1) and paid Gemini/OpenAI (3)
    supportedCapabilities: [
      'tutor',
      'explain',
      'hint',
      'generateQuestion',
      'generateMCQ',
      'generateFlashcards',
      'evaluateAnswer',
      'misconceptionCorrection',
      'challenge',
      'complexReasoning',
      'summarize',
      'translate',
      'mathSolve',
      'longContext',
      'documentQA',
    ],
  };

  private getBaseUrl(): string {
    const raw = process.env.FREE_LLM_API_URL || process.env.FREELLMAPI_URL || 'http://localhost:4000/v1';
    return raw.replace(/\/+$/, '');
  }

  override getApiKey(): string | undefined {
    return process.env.FREE_LLM_API_KEY || process.env.FREELLMAPI_API_KEY;
  }

  override isEnabled(): boolean {
    const flag = process.env.FREE_LLM_API_ENABLED ?? process.env.FREELLMAPI_ENABLED;
    return flag === undefined || flag === 'true' || flag === '1';
  }

  override isConfigured(): boolean {
    if (!this.isEnabled()) return false;
    // Configured if either custom URL or API key is provided
    const hasCustomUrl = Boolean(process.env.FREE_LLM_API_URL || process.env.FREELLMAPI_URL);
    const hasKey = Boolean(this.getApiKey() && this.getApiKey()!.trim().length > 0);
    return hasCustomUrl || hasKey;
  }

  /**
   * Maps Xpedition capability to recommended FreeLLMAPI model family.
   */
  private selectModelForCapability(capability: Capability): string {
    switch (capability) {
      case 'hint':
      case 'tutor':
        return 'meta-llama/llama-3.3-70b-instruct';
      case 'complexReasoning':
      case 'mathSolve':
        return 'qwen/qwen-2.5-coder-32b';
      case 'documentQA':
      case 'longContext':
        return 'mistralai/mistral-small';
      default:
        return 'auto:fast'; // FreeLLMAPI profile auto-routing
    }
  }

  async execute<T = unknown>(request: ProviderExecutionRequest): Promise<ProviderExecutionResult<T>> {
    const startTime = Date.now();

    if (!this.isConfigured()) {
      return {
        data: null,
        text: '',
        provider: 'fallback',
        latencyMs: Date.now() - startTime,
        success: false,
        error: 'FreeLLMAPI provider is not configured or disabled.',
        failureType: 'auth_or_config',
      };
    }

    const model = this.selectModelForCapability(request.capability);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout limit

    try {
      const messages: Array<{ role: string; content: string }> = [];

      if (request.systemPrompt) {
        messages.push({ role: 'system', content: request.systemPrompt });
      }

      let userContent = request.userPrompt;
      if (request.documentContext) {
        userContent = `${userContent}\n\nDocument Context:\n${request.documentContext}`;
      }
      messages.push({ role: 'user', content: userContent });

      const requestBody: Record<string, any> = {
        model,
        messages,
        temperature: request.temperature ?? 0.3,
        max_tokens: request.maxTokens ?? 1500,
      };

      if (request.json) {
        requestBody.response_format = { type: 'json_object' };
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const apiKey = this.getApiKey();
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch(`${this.getBaseUrl()}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        const failureType = this.classifyFailure(errorText, response.status);
        return {
          data: null,
          text: '',
          provider: 'freellmapi',
          modelUsed: model,
          latencyMs: Date.now() - startTime,
          success: false,
          error: `FreeLLMAPI returned HTTP ${response.status}: ${errorText.slice(0, 150)}`,
          failureType,
        };
      }

      const jsonResponse = await response.json();
      const content = jsonResponse.choices?.[0]?.message?.content || '';
      const usage = jsonResponse.usage;

      let parsedData: T | null = null;
      if (request.json) {
        if (!content || !content.trim()) {
          return {
            data: null,
            text: content,
            provider: 'freellmapi',
            modelUsed: jsonResponse.model || model,
            latencyMs: Date.now() - startTime,
            success: false,
            error: 'FreeLLMAPI returned empty response for JSON request.',
            failureType: 'malformed_response',
          };
        }

        try {
          parsedData = JSON.parse(this.stripMarkdownFences(content));
        } catch (parseErr: any) {
          return {
            data: null,
            text: content,
            provider: 'freellmapi',
            modelUsed: jsonResponse.model || model,
            latencyMs: Date.now() - startTime,
            success: false,
            error: `FreeLLMAPI returned malformed JSON: ${parseErr.message}`,
            failureType: 'malformed_response',
          };
        }
      }

      return {
        data: parsedData,
        text: content,
        provider: 'freellmapi',
        modelUsed: jsonResponse.model || model,
        latencyMs: Date.now() - startTime,
        approximateTokens: usage
          ? {
              promptTokens: usage.prompt_tokens,
              completionTokens: usage.completion_tokens,
              totalTokens: usage.total_tokens,
            }
          : undefined,
        success: true,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isAbort = err.name === 'AbortError';
      const failureType = isAbort ? 'timeout' : this.classifyFailure(err);
      return {
        data: null,
        text: '',
        provider: 'freellmapi',
        modelUsed: model,
        latencyMs: Date.now() - startTime,
        success: false,
        error: isAbort ? 'FreeLLMAPI request timed out after 15s.' : err.message || 'FreeLLMAPI request failed.',
        failureType,
      };
    }
  }
}
