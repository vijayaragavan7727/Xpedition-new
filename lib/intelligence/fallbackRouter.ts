/**
 * Xpedition Intelligence Layer v1 — Fallback Capability Router
 *
 * Executes provider calls with controlled fallback chains when providers are
 * unconfigured or encounter runtime errors.
 */

import {
  Decision,
  IntelligenceRequest,
  IntelligenceTrace,
  ProviderExecutionRequest,
  ProviderExecutionResult,
  ProviderId,
} from './types';
import { ProviderRegistry, defaultProviderRegistry } from './providerRegistry';
import { recordIntelligenceTrace } from './observability';

export interface ExecutionOptions {
  registry?: ProviderRegistry;
  timeoutMs?: number;
}

export class FallbackRouter {
  constructor(private registry: ProviderRegistry = defaultProviderRegistry) {}

  async execute<T = unknown>(
    decision: Decision,
    request: IntelligenceRequest
  ): Promise<ProviderExecutionResult<T>> {
    const startTime = Date.now();
    const requestId = request.id || `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const chain: ProviderId[] = [decision.primaryProvider, ...decision.fallbackProviders];
    const attemptedProviders: ProviderId[] = [];
    let lastError: string | undefined;

    const execRequest: ProviderExecutionRequest = {
      capability: decision.capability,
      systemPrompt: request.systemPrompt,
      userPrompt: request.userPrompt || request.query || '',
      json: request.json,
      temperature: request.temperature,
      maxTokens: request.maxTokens,
      multimodalAttachments: request.multimodalAttachments,
      metadata: request.metadata,
    };

    for (const providerId of chain) {
      const provider = this.registry.get(providerId);
      if (!provider) continue;

      if (!provider.isConfigured()) {
        console.warn(`[FallbackRouter] Provider '${providerId}' missing API key. Falling back...`);
        continue;
      }

      attemptedProviders.push(providerId);

      try {
        const result = await provider.execute<T>(execRequest);

        if (result.success) {
          const fallbackUsed = providerId !== decision.primaryProvider;

          // Record safe observability trace
          const trace: IntelligenceTrace = {
            requestId,
            timestamp: Date.now(),
            capability: decision.capability,
            selectedProvider: providerId,
            attemptedProviders,
            fallbackUsed,
            latencyMs: Date.now() - startTime,
            success: true,
            tokenMetadata: result.approximateTokens,
          };
          recordIntelligenceTrace(trace);

          return {
            ...result,
            latencyMs: Date.now() - startTime,
          };
        } else {
          lastError = result.error;
          console.warn(`[FallbackRouter] Provider '${providerId}' failed (${result.error}). Attempting next in chain...`);
        }
      } catch (err: any) {
        lastError = err?.message || 'Execution error';
        console.warn(`[FallbackRouter] Provider '${providerId}' threw exception: ${lastError}`);
      }
    }

    // All configured providers in chain failed or none were configured
    const totalLatency = Date.now() - startTime;
    const safeErrorMessage = attemptedProviders.length === 0
      ? 'No AI provider API keys configured for this capability.'
      : `All candidate providers failed (${attemptedProviders.join(', ')}). ${lastError || ''}`;

    const failTrace: IntelligenceTrace = {
      requestId,
      timestamp: Date.now(),
      capability: decision.capability,
      selectedProvider: decision.primaryProvider,
      attemptedProviders,
      fallbackUsed: attemptedProviders.length > 1,
      latencyMs: totalLatency,
      success: false,
      error: safeErrorMessage,
      failureType: attemptedProviders.length === 0 ? 'auth_or_config' : 'unavailable',
    };
    recordIntelligenceTrace(failTrace);

    return {
      data: null,
      text: '',
      provider: 'fallback',
      latencyMs: totalLatency,
      success: false,
      error: safeErrorMessage,
      failureType: attemptedProviders.length === 0 ? 'auth_or_config' : 'unavailable',
    };
  }
}

export const defaultFallbackRouter = new FallbackRouter();
