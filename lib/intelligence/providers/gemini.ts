/**
 * Google Gemini Provider Adapter — Specialized paid provider for multimodal reasoning, long-context tasks, and structured generation.
 */

import { BaseProvider } from './base';
import {
  Capability,
  ProviderExecutionRequest,
  ProviderExecutionResult,
  ProviderId,
  ProviderPolicy,
} from '../types';

export class GeminiProvider extends BaseProvider {
  readonly providerId: ProviderId = 'gemini';
  readonly envKeyName = 'GEMINI_API_KEY';
  readonly isPaidProvider = true;

  readonly defaultPolicy: ProviderPolicy = {
    providerId: 'gemini',
    costTier: 'paid',
    latencyTier: 'fast',
    qualityTier: 'high',
    priority: 3, // Specialized / fallback priority
    supportedCapabilities: [
      'multimodal',
      'longContext',
      'documentQA',
      'complexReasoning',
      'tutor',
      'explain',
      'hint',
      'generateQuestion',
      'generateMCQ',
      'generateFlashcards',
      'evaluateAnswer',
      'misconceptionCorrection',
      'challenge',
      'summarize',
      'translate',
      'mathSolve',
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
        error: 'Gemini provider is disabled (PAID_AI_ENABLED=false)',
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
        error: 'GEMINI_API_KEY is not configured',
      };
    }

    const {
      systemPrompt = '',
      userPrompt,
      documentContext,
      json = false,
      temperature = 0.3,
      maxTokens = 4000,
      multimodalAttachments,
    } = request;

    const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const models = [model, 'gemini-1.5-pro', 'gemini-flash-latest'];
    let lastError: string | undefined;

    for (const targetModel of models) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;

        const parts: any[] = [];
        if (systemPrompt) {
          parts.push({ text: `SYSTEM DIRECTIVE: ${systemPrompt}` });
        }
        if (documentContext) {
          parts.push({ text: `DOCUMENT CONTEXT:\n${documentContext}` });
        }
        parts.push({ text: userPrompt });

        if (multimodalAttachments && multimodalAttachments.length > 0) {
          multimodalAttachments.forEach((att) => {
            if (att.base64 && att.mimeType) {
              parts.push({
                inlineData: {
                  mimeType: att.mimeType,
                  data: att.base64.replace(/^data:[^;]+;base64,/, ''),
                },
              });
            }
          });
        }

        const bodyPayload: Record<string, unknown> = {
          contents: [{ role: 'user', parts }],
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
          },
        };

        if (json) {
          (bodyPayload.generationConfig as any).responseMimeType = 'application/json';
        }

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const resData = await res.json();
          const content = resData.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const cleanedText = json ? this.stripMarkdownFences(content) : content.trim();

          let parsedData: T | null = null;
          if (json && cleanedText) {
            try {
              parsedData = JSON.parse(cleanedText) as T;
            } catch (err) {
              console.warn('[GeminiAdapter] JSON parse warning:', err);
            }
          }

          return {
            data: parsedData,
            text: cleanedText,
            provider: this.providerId,
            modelUsed: targetModel,
            latencyMs: Date.now() - startTime,
            approximateTokens: {
              totalTokens: resData.usageMetadata?.totalTokenCount,
            },
            success: true,
          };
        } else {
          lastError = `Gemini status ${res.status}`;
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        lastError = err?.message || 'Gemini network error';
      }
    }

    return {
      data: null,
      text: '',
      provider: this.providerId,
      latencyMs: Date.now() - startTime,
      success: false,
      error: lastError || 'All Gemini models failed',
    };
  }
}
