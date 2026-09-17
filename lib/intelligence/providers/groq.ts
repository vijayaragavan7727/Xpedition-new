/**
 * Groq Provider Adapter — Primary everyday AI provider for fast inference, tutoring, hints, MCQs.
 */

import { BaseProvider } from './base';
import {
  Capability,
  ProviderExecutionRequest,
  ProviderExecutionResult,
  ProviderId,
  ProviderPolicy,
} from '../types';

export class GroqProvider extends BaseProvider {
  readonly providerId: ProviderId = 'groq';
  readonly envKeyName = 'GROQ_API_KEY';
  readonly isPaidProvider = false;

  readonly defaultPolicy: ProviderPolicy = {
    providerId: 'groq',
    costTier: 'low',
    latencyTier: 'ultra_fast',
    qualityTier: 'high',
    priority: 1, // High priority: Default everyday provider
    supportedCapabilities: [
      'tutor',
      'explain',
      'hint',
      'generateQuestion',
      'generateMCQ',
      'generateFlashcards',
      'evaluateAnswer',
      'misconceptionCorrection',
      'summarize',
      'translate',
      'challenge',
    ],
  };

  async execute<T = unknown>(request: ProviderExecutionRequest): Promise<ProviderExecutionResult<T>> {
    const startTime = Date.now();
    const apiKey = this.getApiKey();

    if (!apiKey) {
      return {
        data: null,
        text: '',
        provider: this.providerId,
        latencyMs: Date.now() - startTime,
        success: false,
        error: 'GROQ_API_KEY is not configured',
      };
    }

    const {
      systemPrompt = 'You are Xpedition AI, an adaptive educational tutor.',
      userPrompt,
      json = false,
      temperature = 0.4,
      maxTokens = 4000,
    } = request;

    const models = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'groq/compound'];
    let lastError: string | undefined;

    for (const model of models) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      try {
        const bodyPayload: Record<string, unknown> = {
          model,
          temperature,
          max_tokens: maxTokens,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        };

        if (json) {
          bodyPayload.response_format = { type: 'json_object' };
        }

        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
              console.warn('[GroqAdapter] JSON parse warning:', err);
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
        } else {
          lastError = `Groq status ${res.status}`;
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        lastError = err?.message || 'Network error';
      }
    }

    return {
      data: null,
      text: '',
      provider: this.providerId,
      latencyMs: Date.now() - startTime,
      success: false,
      error: lastError || 'All Groq models failed',
    };
  }
}
