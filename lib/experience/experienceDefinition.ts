/**
 * Xpedition Experience Engine v1 — Canonical Experience Definition Contract
 *
 * Defines the declarative contract for any interactive learning experience.
 * Domain-specific physics formulas, chemical valence tables, and spatial matrix math
 * live in their respective modules and are injected via this clean contract.
 */

import { CanonicalValidationResult, ExperienceValidator } from './validation';
import { CanonicalExperienceFeedback } from './feedback';
import { ExperienceEvent } from './events';

export type ExperienceLifecycleStage =
  | 'IDLE'
  | 'STARTED'
  | 'PREDICTING'
  | 'INTERACTING'
  | 'CHECKING'
  | 'COMPLETED'
  | 'NEEDS_CORRECTION';

export type ExperienceTemplateType =
  | 'simulation'
  | 'manipulation'
  | 'builder'
  | 'code'
  | 'custom';

export interface CanonicalExperienceResult<TEvidence = any> {
  experienceId: string;
  conceptId: string;
  completed: boolean;
  success: boolean;
  attempts: number;
  hintsUsed: number;
  corrections: number;
  interactionCount: number;
  timeSpentSeconds: number;
  independentCompletion: boolean;
  prediction?: {
    selectedOptionId?: string;
    isCorrect?: boolean;
    prompt?: string;
  };
  validationHistory: CanonicalValidationResult<any>[];
  telemetrySummary: {
    eventCount: number;
    firstActionTimestamp?: number;
    lastActionTimestamp?: number;
    eventTypes: string[];
  };
  evidence: TEvidence;
  timestamp: number;
}

export interface ExperienceDefinition<
  TConfig = Record<string, any>,
  TState = Record<string, any>,
  TEvidence = any
> {
  id: string;
  type: string;
  conceptId: string;
  title: string;
  objective: string;
  difficulty: number; // 0.0 to 1.0
  template: ExperienceTemplateType;

  /**
   * Static or parameterized configuration for the experience.
   */
  configuration: TConfig;

  /**
   * Initial domain state when experience begins.
   */
  initialState: TState;

  /**
   * Domain-specific validation logic returning a CanonicalValidationResult.
   */
  validator: ExperienceValidator<TState, TConfig, TEvidence>;

  /**
   * Domain-specific feedback generator producing CanonicalExperienceFeedback.
   */
  feedbackGenerator?: (
    validation: CanonicalValidationResult<TEvidence>,
    state: TState,
    history: CanonicalValidationResult<TEvidence>[]
  ) => CanonicalExperienceFeedback;

  /**
   * Custom result transformer (optional; orchestrator provides default builder).
   */
  resultBuilder?: (
    def: ExperienceDefinition<TConfig, TState, TEvidence>,
    state: TState,
    history: CanonicalValidationResult<TEvidence>[],
    events: ExperienceEvent[],
    stats: {
      attempts: number;
      hintsUsed: number;
      corrections: number;
      interactionCount: number;
      timeSpentSeconds: number;
      prediction?: { selectedOptionId?: string; isCorrect?: boolean; prompt?: string };
    }
  ) => CanonicalExperienceResult<TEvidence>;

  /**
   * Available hints ordered by depth.
   */
  hints?: string[];

  /**
   * Optional prediction challenge metadata.
   */
  predictionChallenge?: {
    prompt: string;
    options: Array<{ id: string; label: string; isCorrect?: boolean }>;
    explanation?: string;
  };
}
