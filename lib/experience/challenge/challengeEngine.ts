/**
 * Experience Challenge Engine
 *
 * Coordinates the learner's challenge lifecycle:
 * 1. INTRO / Objective presentation
 * 2. PREDICTING — Student forms a hypothesis before acting
 * 3. CONFIGURING — Student manipulates variables
 * 4. LAUNCHING — 3D simulation execution
 * 5. OBSERVING — Result analysis & comparison with prediction
 * 6. COMPLETED — Objective achieved or next phase
 */

import {
  ChallengeConfig,
  ChallengeStage,
  PredictionChallengeConfig,
} from '../types';
import { SimulationResult } from '../simulation/projectilePhysics';

export interface ChallengeState {
  stage: ChallengeStage;
  objective: string;
  predictionConfig?: PredictionChallengeConfig;
  selectedPredictionId?: string;
  isPredictionSubmitted: boolean;
  isPredictionCorrect?: boolean;
  predictionExplanation?: string;
  activeHintIndex: number;
  availableHints: string[];
  currentAttempt: number;
  maxAttempts: number;
  hasSucceeded: boolean;
  lastSimResult?: SimulationResult;
}

export class ChallengeEngine {
  private state: ChallengeState;

  constructor(private readonly config: ChallengeConfig) {
    this.state = {
      stage: config.prediction ? 'PREDICTING' : 'CONFIGURING',
      objective: config.objective,
      predictionConfig: config.prediction,
      selectedPredictionId: undefined,
      isPredictionSubmitted: false,
      isPredictionCorrect: undefined,
      predictionExplanation: undefined,
      activeHintIndex: -1,
      availableHints: config.hints || [],
      currentAttempt: 1,
      maxAttempts: config.maxAttempts || 5,
      hasSucceeded: false,
      lastSimResult: undefined,
    };
  }

  /**
   * Get current challenge state.
   */
  getState(): ChallengeState {
    return { ...this.state };
  }

  /**
   * Submit student's prediction hypothesis before launching.
   */
  submitPrediction(predictionId: string): {
    selectedId: string;
    stage: ChallengeStage;
  } {
    this.state.selectedPredictionId = predictionId;
    this.state.isPredictionSubmitted = true;
    this.state.stage = 'CONFIGURING';

    return {
      selectedId: predictionId,
      stage: this.state.stage,
    };
  }

  /**
   * Transition to launching simulation.
   */
  startLaunch(): ChallengeStage {
    this.state.stage = 'LAUNCHING';
    return this.state.stage;
  }

  /**
   * Complete simulation and evaluate outcome against prediction and target criteria.
   */
  evaluateOutcome(simResult: SimulationResult): {
    isHit: boolean;
    isPredictionCorrect?: boolean;
    stage: ChallengeStage;
  } {
    this.state.lastSimResult = simResult;
    this.state.hasSucceeded = simResult.isHit;

    // Evaluate prediction if configured
    if (this.state.predictionConfig && this.state.selectedPredictionId) {
      const option = this.state.predictionConfig.options.find(
        (o) => o.id === this.state.selectedPredictionId
      );

      // The prediction is correct if student selected the option marked isCorrect
      // or if their qualitative prediction matches the physical landing
      let correct = Boolean(option?.isCorrect);

      // Dynamic qualitative matching:
      // Option 'undershoot' is correct if targetError < -tolerance
      // Option 'hit' is correct if isHit
      // Option 'overshoot' is correct if targetError > tolerance
      if (this.state.selectedPredictionId === 'short') {
        correct = simResult.targetError < -1.5;
      } else if (this.state.selectedPredictionId === 'hit') {
        correct = simResult.isHit;
      } else if (this.state.selectedPredictionId === 'far') {
        correct = simResult.targetError > 1.5;
      }

      this.state.isPredictionCorrect = correct;
      this.state.predictionExplanation = this.state.predictionConfig.explanation;
    }

    if (simResult.isHit) {
      this.state.stage = 'COMPLETED';
    } else {
      this.state.stage = 'OBSERVING';
    }

    return {
      isHit: simResult.isHit,
      isPredictionCorrect: this.state.isPredictionCorrect,
      stage: this.state.stage,
    };
  }

  /**
   * Move to next attempt / retry.
   */
  retry(): ChallengeStage {
    this.state.currentAttempt++;
    this.state.stage = 'CONFIGURING';
    return this.state.stage;
  }

  /**
   * Request the next available progressive hint.
   */
  requestHint(): string | null {
    if (this.state.activeHintIndex + 1 < this.state.availableHints.length) {
      this.state.activeHintIndex++;
      return this.state.availableHints[this.state.activeHintIndex];
    }
    return this.state.availableHints[this.state.activeHintIndex] || null;
  }
}
