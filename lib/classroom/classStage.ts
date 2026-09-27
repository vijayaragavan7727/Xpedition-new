/**
 * Single source of truth for mapping a lesson step to its Class stage.
 *
 * Previously SmartBoard and the integration runtime each derived a stage from
 * `stepNumber` with slightly different rules. Both now call this function.
 */

import type { ClassroomLessonStep, ClassStepStage } from '@/components/classroom/types';

export function resolveStepStage(step: ClassroomLessonStep, stepIndex: number, totalSteps: number): ClassStepStage {
  if (step.stage) return step.stage;
  if (step.checkQuestion) return 'question';
  if (step.visualType === 'interactive_simulation' || step.visualType === 'interactive_diagram') return 'interact';
  if (stepIndex === 0) return 'introduce';
  if (stepIndex === totalSteps - 1) return 'reward';
  if (stepIndex === 1) return 'explain';
  return 'show';
}

/** Human-readable label for the stage chip on the Smart Board. */
export const CLASS_STAGE_LABELS: Record<ClassStepStage, string> = {
  introduce: 'Introduce',
  explain: 'Explain',
  show: 'Show',
  interact: 'Interact',
  question: 'Question',
  practice: 'Practice',
  challenge: 'Challenge',
  assess: 'Assess',
  reward: 'Reward',
};
