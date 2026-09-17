/**
 * Xpedition Adaptive Learning Loop v1
 *
 * Connects learner activities / quest completions to the Decision Engine
 * to determine the Next Best Action without mutating mastery, XP, or BKT.
 *
 * Core Cycle:
 * Learner Activity -> Store Telemetry / BKT -> Normalized LearnerState -> Decision Engine -> NextBestAction
 */

import { NextBestAction } from './types';
import { DecisionEngine, defaultDecisionEngine } from './decisionEngine';
import { mapStoreToLearnerState } from './contextMapper';
import type { SkillGraph, UserStoreData } from '../store';
import type { CurriculumPlan } from './types';
import { recomposeCurriculum } from './curriculum';


export interface ActivityCompletionContext {
  activityType?: 'quest' | 'lesson' | 'solo_arena' | 'flashcards' | 'review' | 'custom';
  conceptId?: string;
  conceptName?: string;
  sessionId?: string;
  questionCount?: number;
  completed?: boolean;
  lastAnswerCorrect?: boolean;
  source?: string;
}

export interface AdaptiveLoopResult {
  nextAction: NextBestAction;
  completionContext?: ActivityCompletionContext;
  evaluatedAt: number;
  curriculumPlan?: CurriculumPlan;
}

export class AdaptiveLoopService {
  constructor(private engine: DecisionEngine = defaultDecisionEngine) {}

  /**
   * Resolves the next adaptive learning action after an activity or state change.
   * Purely reads store data without mutating mastery, XP, or streak.
   */
  resolveNextLearningAction(
    storeData?: Partial<UserStoreData>,
    context?: ActivityCompletionContext
  ): AdaptiveLoopResult {
    const learnerState = mapStoreToLearnerState(storeData, context?.conceptId);
    const nextAction = this.engine.decideNextAction(learnerState, context?.activityType);
    // Retrieve active graph for curriculum recomposition
    const activeGraph: SkillGraph | undefined = (
      storeData?.graphs?.find((g) => g.id === storeData?.activeGraphId) || storeData?.graphs?.[0]
    );
    const curriculumPlan = activeGraph ? recomposeCurriculum(learnerState, activeGraph) : undefined;

    return {
      nextAction,
      completionContext: context,
      evaluatedAt: Date.now(),
      curriculumPlan,
    };
  }
}

// Global singleton instance
export const defaultAdaptiveLoop = new AdaptiveLoopService();

/**
 * Convenience helper to resolve the Next Best Action from user store data
 * after an activity or session completion.
 */
export function getNextAdaptiveAction(
  storeData?: Partial<UserStoreData>,
  context?: ActivityCompletionContext
): NextBestAction {
  return defaultAdaptiveLoop.resolveNextLearningAction(storeData, context).nextAction;
}
