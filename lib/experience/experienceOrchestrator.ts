/**
 * Xpedition Experience Engine v1 — Unified Experience Orchestrator
 *
 * Coordinates the generic lifecycle, telemetry, validation, feedback, and result
 * generation for all learning experiences.
 *
 * INVARIANT: This orchestrator contains ZERO domain physics equations, ZERO chemical
 * valence rules, and ZERO spatial geometry formulas. It coordinates strictly through
 * ExperienceDefinition contracts.
 */

import {
  ExperienceDefinition,
  ExperienceLifecycleStage,
  CanonicalExperienceResult,
} from './experienceDefinition';
import { CanonicalValidationResult } from './validation';
import { CanonicalExperienceFeedback, createExperienceFeedback } from './feedback';
import { ExperienceEvent, createExperienceEvent } from './events';

export interface OrchestratorSnapshot<TState = any, TEvidence = any> {
  experienceId: string;
  conceptId: string;
  stage: ExperienceLifecycleStage;
  state: TState;
  attempts: number;
  hintsUsed: number;
  corrections: number;
  interactionCount: number;
  latestFeedback?: CanonicalExperienceFeedback;
  validationHistory: CanonicalValidationResult<TEvidence>[];
}

export class ExperienceOrchestrator<
  TConfig = Record<string, any>,
  TState = Record<string, any>,
  TEvidence = any
> {
  private definition: ExperienceDefinition<TConfig, TState, TEvidence>;
  private stage: ExperienceLifecycleStage = 'IDLE';
  private state: TState;
  private events: ExperienceEvent[] = [];
  private validationHistory: CanonicalValidationResult<TEvidence>[] = [];

  private attempts: number = 0;
  private hintsUsed: number = 0;
  private corrections: number = 0;
  private interactionCount: number = 0;
  private startTime: number = 0;
  private endTime?: number;

  private currentPrediction?: {
    selectedOptionId: string;
    isCorrect?: boolean;
    prompt: string;
  };

  private latestFeedback?: CanonicalExperienceFeedback;

  constructor(definition: ExperienceDefinition<TConfig, TState, TEvidence>) {
    this.definition = definition;
    this.state = JSON.parse(JSON.stringify(definition.initialState));
  }

  /**
   * Start or restart the experience.
   * Enters PREDICTING if a prediction challenge exists, otherwise INTERACTING.
   */
  public startExperience(): ExperienceLifecycleStage {
    this.startTime = Date.now();
    this.stage = this.definition.predictionChallenge ? 'PREDICTING' : 'INTERACTING';

    this.recordEvent('experience_started', {
      initialStage: this.stage,
      conceptId: this.definition.conceptId,
      template: this.definition.template,
    });

    return this.stage;
  }

  /**
   * Record a learner's prediction.
   */
  public submitPrediction(optionId: string): {
    isCorrect?: boolean;
    stage: ExperienceLifecycleStage;
  } {
    const challenge = this.definition.predictionChallenge;
    let isCorrect: boolean | undefined = undefined;

    if (challenge) {
      const matched = challenge.options.find((opt) => opt.id === optionId);
      isCorrect = matched?.isCorrect;
      this.currentPrediction = {
        selectedOptionId: optionId,
        isCorrect,
        prompt: challenge.prompt,
      };
    }

    this.recordEvent('prediction_submitted', {
      optionId,
      isCorrect,
    });

    this.stage = 'INTERACTING';
    return { isCorrect, stage: this.stage };
  }

  /**
   * Update the internal domain state via pure updater or direct patch.
   */
  public updateState(
    updater: Partial<TState> | ((prevState: TState) => TState),
    eventPayload?: Record<string, any>
  ): TState {
    if (typeof updater === 'function') {
      this.state = updater(this.state);
    } else {
      this.state = { ...this.state, ...updater };
    }

    this.interactionCount++;

    this.recordEvent('interaction_changed', {
      interactionCount: this.interactionCount,
      ...eventPayload,
    });

    return this.state;
  }

  /**
   * Record a canonical or domain event.
   */
  public recordEvent<TPayload = Record<string, any>>(
    type: string,
    payload: TPayload = {} as TPayload
  ): ExperienceEvent<TPayload> {
    const event = createExperienceEvent<TPayload>(
      type,
      this.definition.id,
      this.definition.conceptId,
      this.attempts,
      payload
    );
    this.events.push(event as ExperienceEvent);
    return event;
  }

  /**
   * Execute domain validator through the orchestrator.
   */
  public validate(): {
    validation: CanonicalValidationResult<TEvidence>;
    feedback: CanonicalExperienceFeedback;
    stage: ExperienceLifecycleStage;
  } {
    this.stage = 'CHECKING';
    this.attempts++;

    this.recordEvent('validation_requested', {
      attemptNumber: this.attempts,
    });

    // Execute domain validator without knowing domain math
    const result = this.definition.validator(this.state, this.definition.configuration);
    this.validationHistory.push(result);

    // Resolve feedback via definition generator or fallback
    let feedback: CanonicalExperienceFeedback;
    if (this.definition.feedbackGenerator) {
      feedback = this.definition.feedbackGenerator(result, this.state, this.validationHistory);
    } else if (result.isComplete || result.status === 'COMPLETE') {
      feedback = createExperienceFeedback('SUCCESS', result.feedback || 'Goal achieved!');
    } else if (result.isValid || result.status === 'VALID') {
      feedback = createExperienceFeedback('ENCOURAGEMENT', result.feedback || 'Step successful. Keep going!');
    } else {
      feedback = createExperienceFeedback('CORRECTION', result.reason || result.feedback || 'Adjustment needed.');
    }

    this.latestFeedback = feedback;
    this.recordEvent('feedback_shown', {
      feedbackType: feedback.type,
      message: feedback.message,
    });

    // Update lifecycle state based on validation status
    if (result.isComplete || result.status === 'COMPLETE') {
      this.stage = 'COMPLETED';
      this.endTime = Date.now();
      this.recordEvent('experience_completed', {
        attempts: this.attempts,
        success: true,
      });
    } else if (result.status === 'VALID') {
      // Step is valid but not complete (e.g. partially built molecule)
      this.stage = 'INTERACTING';
    } else {
      this.stage = 'NEEDS_CORRECTION';
      this.corrections++;
    }

    return {
      validation: result,
      feedback,
      stage: this.stage,
    };
  }

  /**
   * Request a hint from the definition's progressive hint catalog.
   */
  public requestHint(): CanonicalExperienceFeedback {
    this.hintsUsed++;
    const hints = this.definition.hints || [];
    const hintIdx = Math.min(this.hintsUsed - 1, hints.length - 1);
    const hintMsg = hints[hintIdx] || 'Review your parameters and try a small adjustment.';

    const feedback = createExperienceFeedback('HINT', hintMsg, {
      confidence: 1.0,
      suggestedAction: 'Apply recommended hint adjustment',
    });

    this.latestFeedback = feedback;
    this.recordEvent('hint_requested', {
      hintIndex: hintIdx,
      hintsUsed: this.hintsUsed,
      message: hintMsg,
    });

    return feedback;
  }

  /**
   * Reset the domain state to initial conditions.
   */
  public reset(): void {
    this.state = JSON.parse(JSON.stringify(this.definition.initialState));
    this.stage = 'INTERACTING';
    this.recordEvent('experience_reset', {
      attempts: this.attempts,
    });
  }

  /**
   * Force completion or finalize experience.
   */
  public complete(): CanonicalExperienceResult<TEvidence> {
    this.stage = 'COMPLETED';
    if (!this.endTime) {
      this.endTime = Date.now();
    }
    this.recordEvent('experience_completed', {
      forced: true,
      attempts: this.attempts,
    });
    return this.getResult();
  }

  /**
   * Synthesize canonical ExperienceResult.
   */
  public getResult(): CanonicalExperienceResult<TEvidence> {
    const elapsed = this.startTime > 0
      ? Math.max(1, Math.round(((this.endTime || Date.now()) - this.startTime) / 1000))
      : 0;

    const eventTypes = Array.from(new Set(this.events.map((e) => e.type)));
    const firstEvent = this.events[0];
    const lastEvent = this.events[this.events.length - 1];

    const stats = {
      attempts: this.attempts,
      hintsUsed: this.hintsUsed,
      corrections: this.corrections,
      interactionCount: this.interactionCount,
      timeSpentSeconds: elapsed,
      prediction: this.currentPrediction,
    };

    if (this.definition.resultBuilder) {
      return this.definition.resultBuilder(
        this.definition,
        this.state,
        this.validationHistory,
        this.events,
        stats
      );
    }

    const lastValidation = this.validationHistory[this.validationHistory.length - 1];
    const isSuccess = lastValidation
      ? lastValidation.isComplete || lastValidation.status === 'COMPLETE'
      : false;

    return {
      experienceId: this.definition.id,
      conceptId: this.definition.conceptId,
      completed: this.stage === 'COMPLETED' || isSuccess,
      success: isSuccess,
      attempts: this.attempts,
      hintsUsed: this.hintsUsed,
      corrections: this.corrections,
      interactionCount: this.interactionCount,
      timeSpentSeconds: elapsed,
      independentCompletion: this.hintsUsed === 0 && this.corrections <= 1,
      prediction: this.currentPrediction,
      validationHistory: this.validationHistory,
      telemetrySummary: {
        eventCount: this.events.length,
        firstActionTimestamp: firstEvent?.timestamp,
        lastActionTimestamp: lastEvent?.timestamp,
        eventTypes,
      },
      evidence: (lastValidation?.evidence || {}) as TEvidence,
      timestamp: Date.now(),
    };
  }

  // --- Read-only Accessors ---

  public getLifecycleStage(): ExperienceLifecycleStage {
    return this.stage;
  }

  public getState(): TState {
    return this.state;
  }

  public getDefinition(): ExperienceDefinition<TConfig, TState, TEvidence> {
    return this.definition;
  }

  public getEvents(): ExperienceEvent[] {
    return [...this.events];
  }

  public getValidationHistory(): CanonicalValidationResult<TEvidence>[] {
    return [...this.validationHistory];
  }

  public getLatestFeedback(): CanonicalExperienceFeedback | undefined {
    return this.latestFeedback;
  }

  public getSnapshot(): OrchestratorSnapshot<TState, TEvidence> {
    return {
      experienceId: this.definition.id,
      conceptId: this.definition.conceptId,
      stage: this.stage,
      state: JSON.parse(JSON.stringify(this.state)),
      attempts: this.attempts,
      hintsUsed: this.hintsUsed,
      corrections: this.corrections,
      interactionCount: this.interactionCount,
      latestFeedback: this.latestFeedback,
      validationHistory: [...this.validationHistory],
    };
  }
}
