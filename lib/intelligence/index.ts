/**
 * Xpedition Intelligence Layer v1 — Public Entry Point
 *
 * Unified interface for intelligent capability dispatch, decision making,
 * adaptive learning loop, and multi-provider execution.
 */

import {
  Capability,
  Decision,
  IntelligenceRequest,
  LearnerState,
  NextBestAction,
  ProviderExecutionResult,
  ProviderHealth,
  ProviderId,
} from './types';
import { DecisionEngine, defaultDecisionEngine, getNextBestAction } from './decisionEngine';
import { FallbackRouter, defaultFallbackRouter } from './fallbackRouter';
import { ProviderRegistry, defaultProviderRegistry } from './providerRegistry';
import { mapStoreToLearnerState, mapToLearnerContext } from './contextMapper';
import { AdaptiveLoopService, defaultAdaptiveLoop, getNextAdaptiveAction } from './adaptiveLoop';
import { getRecentIntelligenceTraces } from './observability';

export * from './types';
export type { AdaptiveLoopResult } from './types';
export * from './actions';
export * from './capabilities';
export * from './providerRegistry';
export * from './decisionEngine';
export * from './fallbackRouter';
export * from './contextMapper';
export * from './adaptiveLoop';
export * from './feedbackLoop';
export * from './assessment';
export * from './adaptiveExperienceLoop';
export * from './observability';
export * from './documents';
export * from './execution';
export * from './routingPolicy';
export * from './sources';
export * from './aiValidator';
export * from './providers/base';
export * from './providers/freellmapi';

/**
 * Single internal entry point for running Xpedition Intelligence requests.
 * Evaluates learner state -> Decides capability & provider -> Executes with fallback -> Returns result.
 */
export async function runIntelligence<T = unknown>(
  request: IntelligenceRequest,
  options?: {
    engine?: DecisionEngine;
    router?: FallbackRouter;
  }
): Promise<{
  result: ProviderExecutionResult<T>;
  decision: Decision;
}> {
  const engine = options?.engine || defaultDecisionEngine;
  const router = options?.router || defaultFallbackRouter;

  const decision = engine.decide(request);
  const result = await router.execute<T>(decision, request);

  return {
    result,
    decision,
  };
}

/**
 * Helper to check configuration and health of all registered AI providers.
 */
export async function getIntelligenceHealth(): Promise<Record<ProviderId, ProviderHealth>> {
  return defaultProviderRegistry.getHealthMatrix();
}
