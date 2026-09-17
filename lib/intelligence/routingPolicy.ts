/**
 * Xpedition Intelligence Layer v2 — Capability-Aware Routing Policy
 *
 * Implements workload-specific routing strategies (FAST, DEEP, CREATIVE, GROUNDED, MULTI_MODEL)
 * with circuit breaking, latency tracking, retry, and failover across configured providers
 * (Groq, FreeLLMAPI, Gemini, OpenAI, Tavily).
 */

import {
  Capability,
  IntelligenceRequest,
  IntelligenceTrace,
  ProviderExecutionRequest,
  ProviderExecutionResult,
  ProviderFailureType,
  ProviderId,
} from './types';
import { ProviderRegistry, defaultProviderRegistry } from './providerRegistry';
import { recordIntelligenceTrace } from './observability';
import { classifyProviderError } from './providers/base';

export type WorkloadStrategy = 'FAST' | 'DEEP' | 'CREATIVE' | 'GROUNDED' | 'MULTI_MODEL';

export interface StrategyConfig {
  strategy: WorkloadStrategy;
  preferredProviders: ProviderId[];
  timeoutMs: number;
  maxRetries: number;
  defaultTemperature: number;
  maxTokens?: number;
  description: string;
}

export const WORKLOAD_STRATEGIES: Record<WorkloadStrategy, StrategyConfig> = {
  FAST: {
    strategy: 'FAST',
    preferredProviders: ['groq', 'freellmapi', 'gemini', 'openai'],
    timeoutMs: 6000,
    maxRetries: 1,
    defaultTemperature: 0.2,
    maxTokens: 500,
    description: 'Ultra-low latency responses: Xira hints, quick feedback, simple clarifications',
  },
  DEEP: {
    strategy: 'DEEP',
    preferredProviders: ['groq', 'freellmapi', 'openai', 'gemini'],
    timeoutMs: 16000,
    maxRetries: 1,
    defaultTemperature: 0.2,
    maxTokens: 2500,
    description: 'High-depth reasoning: concept graph decomposition, curriculum synthesis, scene semantic planning',
  },
  CREATIVE: {
    strategy: 'CREATIVE',
    preferredProviders: ['freellmapi', 'groq', 'openai', 'gemini'],
    timeoutMs: 12000,
    maxRetries: 1,
    defaultTemperature: 0.7,
    maxTokens: 1500,
    description: 'Engaging real-world analogies, conceptual metaphors, scenario simulations',
  },
  GROUNDED: {
    strategy: 'GROUNDED',
    preferredProviders: ['groq', 'tavily', 'freellmapi', 'gemini', 'openai'],
    timeoutMs: 14000,
    maxRetries: 1,
    defaultTemperature: 0.1,
    maxTokens: 2000,
    description: 'Verifiable, source-backed learning and document grounded extraction',
  },
  MULTI_MODEL: {
    strategy: 'MULTI_MODEL',
    preferredProviders: ['groq', 'freellmapi', 'gemini'],
    timeoutMs: 16000,
    maxRetries: 0,
    defaultTemperature: 0.3,
    maxTokens: 2500,
    description: 'High-value multi-model consensus / candidate validation for complex teaching plans',
  },
};

export interface ProviderHealthStats {
  consecutiveFailures: number;
  lastFailureTime: number;
  totalCalls: number;
  successfulCalls: number;
  averageLatencyMs: number;
}

export class CapabilityRouter {
  private healthStats = new Map<ProviderId, ProviderHealthStats>();
  private readonly FAILURE_COOLDOWN_MS = 30000; // 30s cooldown after 3 consecutive failures
  private readonly MAX_CONSECUTIVE_FAILURES = 3;

  constructor(private registry: ProviderRegistry = defaultProviderRegistry) {}

  /**
   * Automatically classify workload strategy from capability and request context.
   */
  classifyWorkload(capability: Capability, context?: { isGrounded?: boolean; multiModel?: boolean }): WorkloadStrategy {
    if (context?.multiModel) return 'MULTI_MODEL';
    if (context?.isGrounded) return 'GROUNDED';

    switch (capability) {
      case 'hint':
      case 'tutor':
      case 'evaluateAnswer':
        return 'FAST';
      case 'complexReasoning':
      case 'summarize':
      case 'misconceptionCorrection':
      case 'challenge':
        return 'DEEP';
      case 'research':
      case 'documentQA':
        return 'GROUNDED';
      default:
        return 'FAST';
    }
  }

  /**
   * Check if a provider is currently in cooldown due to circuit breaker.
   */
  isProviderAvailable(providerId: ProviderId): boolean {
    const stats = this.healthStats.get(providerId);
    if (!stats) return true;

    if (stats.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
      const timeSinceLastFailure = Date.now() - stats.lastFailureTime;
      if (timeSinceLastFailure < this.FAILURE_COOLDOWN_MS) {
        return false; // In circuit breaker cooldown
      }
      // Cooldown expired, half-open test
      stats.consecutiveFailures = 1;
    }
    return true;
  }

  private recordSuccess(providerId: ProviderId, latencyMs: number) {
    const stats = this.healthStats.get(providerId) || {
      consecutiveFailures: 0,
      lastFailureTime: 0,
      totalCalls: 0,
      successfulCalls: 0,
      averageLatencyMs: latencyMs,
    };

    stats.consecutiveFailures = 0;
    stats.successfulCalls += 1;
    stats.totalCalls += 1;
    stats.averageLatencyMs = Math.round((stats.averageLatencyMs * (stats.successfulCalls - 1) + latencyMs) / stats.successfulCalls);
    this.healthStats.set(providerId, stats);
  }

  private recordFailure(providerId: ProviderId) {
    const stats = this.healthStats.get(providerId) || {
      consecutiveFailures: 0,
      lastFailureTime: 0,
      totalCalls: 0,
      successfulCalls: 0,
      averageLatencyMs: 0,
    };

    stats.consecutiveFailures += 1;
    stats.lastFailureTime = Date.now();
    stats.totalCalls += 1;
    this.healthStats.set(providerId, stats);
  }

  /**
   * Immediately trip circuit breaker for a provider on unrecoverable error (e.g. invalid key/quota).
   */
  tripCircuitBreaker(providerId: ProviderId) {
    const stats = this.healthStats.get(providerId) || {
      consecutiveFailures: 0,
      lastFailureTime: 0,
      totalCalls: 0,
      successfulCalls: 0,
      averageLatencyMs: 0,
    };
    stats.consecutiveFailures = this.MAX_CONSECUTIVE_FAILURES;
    stats.lastFailureTime = Date.now();
    stats.totalCalls += 1;
    this.healthStats.set(providerId, stats);
  }

  /**
   * Execute with capability-aware routing policy, timeouts, retries, and fallback.
   */
  async execute<T = unknown>(
    strategy: WorkloadStrategy,
    request: IntelligenceRequest
  ): Promise<ProviderExecutionResult<T>> {
    const startTime = Date.now();
    const config = WORKLOAD_STRATEGIES[strategy];
    const requestId = request.id || `route_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const capability = request.requiredCapability || 'tutor';

    // MULTI_MODEL high-value strategy: race 2 independent configured providers and select highest confidence/first valid
    if (strategy === 'MULTI_MODEL') {
      return this.executeMultiModel<T>(config, request, capability, requestId, startTime);
    }

    // Determine candidate provider chain
    const candidateChain = this.buildCandidateChain(config, capability, request.forceProvider);
    const attemptedProviders: ProviderId[] = [];
    let lastError: string | undefined;
    let lastFailureType: ProviderFailureType = 'unknown';

    const execRequest: ProviderExecutionRequest = {
      capability,
      systemPrompt: request.systemPrompt,
      userPrompt: request.userPrompt || request.query || '',
      json: request.json,
      temperature: request.temperature ?? config.defaultTemperature,
      maxTokens: request.maxTokens ?? config.maxTokens,
      multimodalAttachments: request.multimodalAttachments,
      metadata: {
        ...(request.metadata || {}),
        workloadStrategy: strategy,
      },
    };

    for (const providerId of candidateChain) {
      const provider = this.registry.get(providerId);
      if (!provider) continue;

      if (!provider.isConfigured()) {
        continue;
      }

      if (!this.isProviderAvailable(providerId)) {
        console.warn(`[CapabilityRouter] Skipping provider '${providerId}' (circuit breaker cooldown active).`);
        continue;
      }

      attemptedProviders.push(providerId);

      for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
        const attemptStart = Date.now();
        try {
          // Wrap provider execution with strategy timeout
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout after ${config.timeoutMs}ms`)), config.timeoutMs)
          );

          const result = await Promise.race([
            provider.execute<T>(execRequest),
            timeoutPromise,
          ]);

          const callLatency = Date.now() - attemptStart;

          if (result.success) {
            this.recordSuccess(providerId, callLatency);
            const totalLatency = Date.now() - startTime;

            const trace: IntelligenceTrace = {
              requestId,
              timestamp: Date.now(),
              capability,
              selectedProvider: providerId,
              attemptedProviders,
              fallbackUsed: providerId !== candidateChain[0],
              latencyMs: totalLatency,
              success: true,
              tokenMetadata: result.approximateTokens,
            };
            recordIntelligenceTrace(trace);

            return {
              ...result,
              latencyMs: totalLatency,
            };
          } else {
            const failureType = result.failureType || classifyProviderError(result.error);
            this.recordFailure(providerId);
            lastError = result.error;
            lastFailureType = failureType;

            // Non-retryable failures: trip breaker or break retry immediately
            if (failureType === 'auth_or_config' || failureType === 'quota') {
              this.tripCircuitBreaker(providerId);
              break;
            }
            if (failureType === 'malformed_response') {
              break;
            }
          }
        } catch (err: any) {
          const failureType = classifyProviderError(err);
          this.recordFailure(providerId);
          lastError = err?.message || 'Execution exception';
          lastFailureType = failureType;

          if (failureType === 'auth_or_config' || failureType === 'quota') {
            this.tripCircuitBreaker(providerId);
            break;
          }
        }
      }
    }

    // Graceful fallback when all configured providers fail or none configured
    const totalLatency = Date.now() - startTime;
    const safeError = attemptedProviders.length === 0
      ? 'No active AI providers configured for this strategy.'
      : `All providers failed (${attemptedProviders.join(', ')}). ${lastError || ''}`;

    const failTrace: IntelligenceTrace = {
      requestId,
      timestamp: Date.now(),
      capability,
      selectedProvider: candidateChain[0] || 'groq',
      attemptedProviders,
      fallbackUsed: attemptedProviders.length > 1,
      latencyMs: totalLatency,
      success: false,
      error: safeError,
      failureType: lastFailureType,
    };
    recordIntelligenceTrace(failTrace);

    return {
      data: null,
      text: '',
      provider: 'fallback',
      latencyMs: totalLatency,
      success: false,
      error: safeError,
      failureType: lastFailureType,
    };
  }

  /**
   * Multi-model execution: queries top 2 configured providers concurrently and returns
   * the first complete and valid response within the strategy timeout.
   */
  private async executeMultiModel<T>(
    config: StrategyConfig,
    request: IntelligenceRequest,
    capability: Capability,
    requestId: string,
    startTime: number
  ): Promise<ProviderExecutionResult<T>> {
    const available = config.preferredProviders.filter((pId) => {
      const p = this.registry.get(pId);
      return p && p.isConfigured() && this.isProviderAvailable(pId);
    });

    if (available.length < 2) {
      // Degrade to DEEP single-provider fallback
      return this.execute<T>('DEEP', request);
    }

    const targets = available.slice(0, 2);
    const execRequest: ProviderExecutionRequest = {
      capability,
      systemPrompt: request.systemPrompt,
      userPrompt: request.userPrompt || request.query || '',
      json: request.json,
      temperature: request.temperature ?? config.defaultTemperature,
      maxTokens: request.maxTokens ?? config.maxTokens,
      metadata: { ...(request.metadata || {}), workloadStrategy: 'MULTI_MODEL' },
    };

    try {
      const promises = targets.map((pId) => {
        const provider = this.registry.get(pId)!;
        return provider.execute<T>(execRequest).then((res) => ({ pId, res }));
      });

      const winner = await Promise.any(
        promises.map((p) =>
          p.then(({ pId, res }) => {
            if (res.success && (res.data || res.text)) {
              return { pId, res };
            }
            throw new Error(`Provider ${pId} returned unsuccessful or empty response`);
          })
        )
      );

      const totalLatency = Date.now() - startTime;
      this.recordSuccess(winner.pId, totalLatency);

      recordIntelligenceTrace({
        requestId,
        timestamp: Date.now(),
        capability,
        selectedProvider: winner.pId,
        attemptedProviders: targets,
        fallbackUsed: false,
        latencyMs: totalLatency,
        success: true,
        tokenMetadata: winner.res.approximateTokens,
      });

      return {
        ...winner.res,
        latencyMs: totalLatency,
      };
    } catch {
      // If multi-model parallel race fails, fall back to DEEP linear chain
      return this.execute<T>('DEEP', request);
    }
  }

  private buildCandidateChain(
    config: StrategyConfig,
    capability: Capability,
    forceProvider?: ProviderId
  ): ProviderId[] {
    if (forceProvider) {
      return [forceProvider, ...config.preferredProviders.filter((p) => p !== forceProvider)];
    }

    const availableForCapability = this.registry.getProvidersForCapability(capability);
    const chain: ProviderId[] = [];

    // Add strategy preferred providers that support the capability
    for (const p of config.preferredProviders) {
      if (availableForCapability.includes(p) && !chain.includes(p)) {
        chain.push(p);
      }
    }

    // Append remaining providers for capability as backup
    for (const p of availableForCapability) {
      if (!chain.includes(p)) {
        chain.push(p);
      }
    }

    return chain;
  }

  getHealthSummary(): Record<ProviderId, ProviderHealthStats> {
    const summary: Record<string, ProviderHealthStats> = {};
    for (const [id, stats] of this.healthStats.entries()) {
      summary[id] = { ...stats };
    }
    return summary as Record<ProviderId, ProviderHealthStats>;
  }
}

export const defaultCapabilityRouter = new CapabilityRouter();
