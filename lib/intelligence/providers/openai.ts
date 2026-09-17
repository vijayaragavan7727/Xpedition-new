/**
 * OpenAI Provider Adapter — Specialized paid provider for complex reasoning, advanced tutoring, and structured generation.
 */

import { BaseProvider } from './base';
import {
  Capability,
  ProviderExecutionRequest,
  ProviderExecutionResult,
  ProviderId,
  ProviderPolicy,
} from '../types';

export class OpenAIProvider extends BaseProvider {
  readonly providerId: ProviderId = 'openai';
  readonly envKeyName = 'OPENAI_API_KEY';
  readonly isPaidProvider = true;

  readonly defaultPolicy: ProviderPolicy = {
    providerId: 'openai',
    costTier: 'paid',
    latencyTier: 'fast',
    qualityTier: 'expert',
    priority: 3, // Specialized / fallback priority (Groq is default)
    supportedCapabilities: [
      'complexReasoning',
      'tutor',
      'explain',
      'hint',
      'generateQuestion',
      'generateMCQ',
      'generateFlashcards',
      'evaluateAnswer',
      'evaluateWriting',
      'misconceptionCorrection',
      'challenge',
      'summarize',
      'translate',
      'mathSolve',
      'multimodal',
      'documentQA',
      'longContext',
    ],
  };

  async execute<T = unknown>(request: ProviderExecutionRequest): Promise<ProviderExecutionResult<T>> {
    const startTime = Date.now();

    if (!this.isEnabled()) {
      return {
        data: null,
        text: '',
        provider: this.providerId,
        latencyMs: Date.now() - startTime,
        success: false,
        error: 'OpenAI provider is disabled (PAID_AI_ENABLED=false)',
      };
    }

    const apiKey = this.getApiKey();
    if (!apiKey) {
      return {
        data: null,
        text: '',
        provider: this.providerId,
        latencyMs: Date.now() - startTime,
        success: false,
        error: 'OPENAI_API_KEY is not configured',
      };
    }

    const {
      systemPrompt = 'You are Xpedition AI, an advanced educational intelligence engine.',
      userPrompt,
      documentContext,
      json = false,
      temperature = 0.3,
      maxTokens = 4000,
      multimodalAttachments,
    } = request;

    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      let effectivePrompt = userPrompt;
      if (documentContext) {
        effectivePrompt = `DOCUMENT CONTEXT:\n${documentContext}\n\nUSER QUERY:\n${userPrompt}`;
      }

      // Support multimodal content parts
      const userContent: any = multimodalAttachments && multimodalAttachments.length > 0
        ? [
            { type: 'text', text: effectivePrompt },
            ...multimodalAttachments.map((att) => ({
              type: 'image_url',
              image_url: { url: att.url || att.base64 || '' },
            })),
          ]
        : effectivePrompt;

      const bodyPayload: Record<string, unknown> = {
        model,
        temperature,
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
      };

      if (json) {
        bodyPayload.response_format = { type: 'json_object' };
      }

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const resData = await res.json();
        const content = resData.choices?.[0]?.message?.content || '';
        const cleanedText = json ? this.stripMarkdownFences(content) : content.trim();

        let parsedData: T | null = null;
        if (json && cleanedText) {
          try {
            parsedData = JSON.parse(cleanedText) as T;
          } catch (err) {
            console.warn('[OpenAIAdapter] JSON parse warning:', err);
          }
        }

        return {
          data: parsedData,
          text: cleanedText,
          provider: this.providerId,
          modelUsed: model,
          latencyMs: Date.now() - startTime,
          approximateTokens: {
            promptTokens: resData.usage?.prompt_tokens,
            completionTokens: resData.usage?.completion_tokens,
            totalTokens: resData.usage?.total_tokens,
          },
          success: true,
        };
      }

      return {
        data: null,
        text: '',
        provider: this.providerId,
        latencyMs: Date.now() - startTime,
        success: false,
        error: `OpenAI status ${res.status}`,
      };
    } catch (err: any) {
      return {
        data: null,
        text: '',
        provider: this.providerId,
        latencyMs: Date.now() - startTime,
        success: false,
        error: err?.message || 'OpenAI network error',
      };
    }
  }
}
