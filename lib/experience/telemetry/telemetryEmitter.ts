/**
 * Experience Engine Telemetry Emitter & Observation Aggregator
 *
 * Records granular student interactions (variable changes, predictions, launches,
 * hits/misses, retries) and aggregates them into structured Xira observations.
 */

import {
  TelemetryEvent,
  TelemetryEventType,
  TrialRecord,
  XiraExperienceObservation,
} from '../types';

export type TelemetrySubscriber = (event: TelemetryEvent) => void;

export class TelemetryEmitter {
  private events: TelemetryEvent[] = [];
  private trials: TrialRecord[] = [];
  private subscribers: Set<TelemetrySubscriber> = new Set();
  private hintsRequestedCount = 0;

  constructor(
    private readonly experienceId: string,
    private readonly conceptId: string,
    private readonly conceptName: string
  ) {}

  /**
   * Subscribe a callback to live telemetry events.
   */
  subscribe(subscriber: TelemetrySubscriber): () => void {
    this.subscribers.add(subscriber);
    return () => this.subscribers.delete(subscriber);
  }

  /**
   * Record a typed telemetry event.
   */
  emit(type: TelemetryEventType, payload: Record<string, any> = {}): TelemetryEvent {
    const event: TelemetryEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type,
      experienceId: this.experienceId,
      conceptId: this.conceptId,
      timestamp: Date.now(),
      attemptNumber: this.trials.length + 1,
      payload,
    };

    this.events.push(event);

    if (type === 'hint_requested') {
      this.hintsRequestedCount++;
    }

    this.subscribers.forEach((fn) => {
      try {
        fn(event);
      } catch (err) {
        console.error('[TelemetryEmitter] Subscriber error:', err);
      }
    });

    return event;
  }

  /**
   * Record a completed trial (launch -> landing -> evaluation).
   */
  recordTrial(trial: Omit<TrialRecord, 'trialIndex' | 'timestamp'>): TrialRecord {
    const fullTrial: TrialRecord = {
      ...trial,
      trialIndex: this.trials.length + 1,
      timestamp: Date.now(),
    };

    this.trials.push(fullTrial);

    // Emit corresponding telemetry event
    this.emit(fullTrial.isHit ? 'target_hit' : 'target_missed', {
      trialIndex: fullTrial.trialIndex,
      angleDeg: fullTrial.angleDeg,
      velocity: fullTrial.velocity,
      landingDistance: fullTrial.landingDistance,
      targetDistance: fullTrial.targetDistance,
      targetError: fullTrial.targetError,
      isHit: fullTrial.isHit,
      predictedOptionId: fullTrial.predictedOptionId,
      isPredictionCorrect: fullTrial.isPredictionCorrect,
      flightTime: fullTrial.flightTime,
      peakHeight: fullTrial.peakHeight,
    });

    return fullTrial;
  }

  /**
   * Returns all recorded telemetry events.
   */
  getEvents(): TelemetryEvent[] {
    return [...this.events];
  }

  /**
   * Returns all recorded trial records.
   */
  getTrials(): TrialRecord[] {
    return [...this.trials];
  }

  /**
   * Aggregates recorded trials and interaction patterns into a structured Xira observation.
   */
  synthesizeObservation(): XiraExperienceObservation {
    const total = this.trials.length;
    const hits = this.trials.filter((t) => t.isHit).length;
    const hasSucceeded = hits > 0;

    const angleHistory = this.trials.map((t) => t.angleDeg ?? 0);
    const velocityHistory = this.trials.map((t) => t.velocity ?? 0);
    const errorHistory = this.trials.map((t) => t.targetError ?? 0);

    // Calculate prediction accuracy
    const predictionTrials = this.trials.filter((t) => t.isPredictionCorrect !== undefined);
    const correctPredictions = predictionTrials.filter((t) => t.isPredictionCorrect).length;
    const predictionAccuracy =
      predictionTrials.length > 0 ? correctPredictions / predictionTrials.length : 1.0;

    // Detect behavioral pattern
    let detectedPrinciple: XiraExperienceObservation['detectedPrinciple'] = 'exploring';
    let patternSummary = 'Initial exploration of projectile variables.';

    if (total === 0) {
      patternSummary = 'Learner has not yet launched a trial.';
    } else if (hasSucceeded) {
      detectedPrinciple = 'mastered';
      patternSummary = `Successfully hit the target after ${total} trial${total > 1 ? 's' : ''}!`;
    } else {
      // Check if student is consistently undershooting or overshooting
      const allUndershot = errorHistory.every((err) => err < 0);
      const allOvershot = errorHistory.every((err) => err > 0);

      // Check if student tried varying angles toward 45 degrees
      const hasTriedNear45 = angleHistory.some((a) => a >= 40 && a <= 50);

      if (allUndershot) {
        detectedPrinciple = 'undershooting';
        patternSummary = 'Launches are landing short of the target. Higher velocity or an angle closer to 45° needed.';
      } else if (allOvershot) {
        detectedPrinciple = 'overshooting';
        patternSummary = 'Launches are overshooting the target. Lower velocity or a steeper angle needed.';
      } else if (hasTriedNear45) {
        detectedPrinciple = 'approaching_45';
        patternSummary = 'Exploring launch angles near the 45° maximum-range sweet spot.';
      }
    }

    return {
      experienceId: this.experienceId,
      conceptId: this.conceptId,
      conceptName: this.conceptName,
      totalAttempts: total,
      successfulAttempts: hits,
      totalTrials: total,
      successfulTrials: hits,
      targetHits: hits,
      totalInteractions: this.events.length,
      hasSucceeded,
      predictionAccuracy,
      trials: [...this.trials],
      angleHistory,
      velocityHistory,
      errorHistory,
      hintsRequested: this.hintsRequestedCount,
      patternSummary,
      detectedPrinciple,
      principlesIdentified: detectedPrinciple ? [detectedPrinciple] : [],
    };
  }

  /**
   * Reset session telemetry.
   */
  reset(): void {
    this.events = [];
    this.trials = [];
    this.hintsRequestedCount = 0;
  }
}
