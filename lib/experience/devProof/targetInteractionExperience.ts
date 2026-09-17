/**
 * Developer Proof Experience: Simple Target Interaction
 *
 * A test-only experience used to prove that a completely new interactive experience
 * can be defined, registered, and executed through the ExperienceOrchestrator
 * with ZERO modifications to the core orchestrator.
 *
 * currentValue = 40
 * targetValue = 50
 * tolerance = 2
 *
 * Validation:
 * within tolerance (48..52) -> COMPLETE
 * outside tolerance -> NEEDS_CORRECTION / INVALID
 */

import { ExperienceDefinition } from '../experienceDefinition';
import { createExperienceFeedback } from '../feedback';

export interface TargetInteractionConfig {
  targetValue: number;
  tolerance: number;
}

export interface TargetInteractionState {
  currentValue: number;
}

export const TARGET_INTERACTION_DEFINITION: ExperienceDefinition<
  TargetInteractionConfig,
  TargetInteractionState,
  { delta: number; isWithinTolerance: boolean }
> = {
  id: 'dev_proof_simple_target',
  type: 'SIMPLE_TARGET_INTERACTION',
  conceptId: 'numerical_precision',
  title: 'Developer Proof: Target Tuning',
  objective: 'Tune the current value to within 2 units of the target value (50).',
  difficulty: 0.1,
  template: 'simulation',
  configuration: {
    targetValue: 50,
    tolerance: 2,
  },
  initialState: {
    currentValue: 40,
  },
  hints: [
    'The target is 50. Increase your current value by +10.',
    'Values between 48 and 52 are accepted as complete.',
  ],
  validator: (state, config) => {
    const delta = Math.abs(state.currentValue - config.targetValue);
    const isWithinTolerance = delta <= config.tolerance;
    const status = isWithinTolerance ? 'COMPLETE' : 'INVALID';

    return {
      status,
      isValid: isWithinTolerance,
      isComplete: isWithinTolerance,
      score: isWithinTolerance ? 100 : Math.max(0, 100 - delta * 10),
      reason: isWithinTolerance
        ? `Target reached within tolerance (delta: ${delta} <= ${config.tolerance}).`
        : `Current value ${state.currentValue} is outside tolerance ${config.tolerance} (delta: ${delta}).`,
      evidence: {
        delta,
        isWithinTolerance,
      },
      feedback: isWithinTolerance
        ? 'Target achieved!'
        : state.currentValue < config.targetValue
        ? 'Value is too low. Increase value.'
        : 'Value is too high. Decrease value.',
    };
  },
  feedbackGenerator: (validation, state) => {
    return createExperienceFeedback(
      validation.isComplete ? 'SUCCESS' : 'CORRECTION',
      validation.feedback || 'Adjust value towards target 50.',
      {
        pedagogicalInsight: 'Proportional adjustments converge quickly on steady-state targets.',
        suggestedAction: state.currentValue < 50 ? 'Increase value by +5' : 'Decrease value by -5',
      }
    );
  },
};
