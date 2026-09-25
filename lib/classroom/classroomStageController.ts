/**
 * Classroom Stage Controller (Phase 4, Step 4)
 *
 * Deterministic stage state machine governing the progression of learning stages:
 * INTRODUCE -> EXPLAIN -> DEMONSTRATE -> INTERACT -> QUESTION -> FEEDBACK -> PRACTICE -> CHALLENGE -> ASSESS -> REWARD -> NEXT
 */

import {
  ClassroomStage,
  CLASSROOM_STAGE_SEQUENCE,
} from './classroomSessionTypes';

export class ClassroomStageController {
  /**
   * Returns the zero-based index of a given stage in the standard sequence.
   */
  public getStageIndex(stage: ClassroomStage): number {
    const idx = CLASSROOM_STAGE_SEQUENCE.indexOf(stage);
    return idx >= 0 ? idx : 0;
  }

  /**
   * Determines the next pedagogical stage based on current stage and outcome.
   */
  public getNextStage(
    currentStage: ClassroomStage,
    options: {
      questionAnsweredCorrectly?: boolean;
      retryRequested?: boolean;
      forceNextInSequence?: boolean;
    } = {}
  ): ClassroomStage {
    if (options.forceNextInSequence) {
      const idx = this.getStageIndex(currentStage);
      if (idx < CLASSROOM_STAGE_SEQUENCE.length - 1) {
        return CLASSROOM_STAGE_SEQUENCE[idx + 1];
      }
      return 'NEXT';
    }

    switch (currentStage) {
      case 'INTRODUCE':
        return 'EXPLAIN';

      case 'EXPLAIN':
        return 'DEMONSTRATE';

      case 'DEMONSTRATE':
        return 'INTERACT';

      case 'INTERACT':
        return 'QUESTION';

      case 'QUESTION':
        // If an answer was just submitted:
        if (options.questionAnsweredCorrectly === false) {
          return 'FEEDBACK'; // Route to remedial feedback
        }
        if (options.questionAnsweredCorrectly === true) {
          return 'PRACTICE'; // Advance to practice
        }
        return 'FEEDBACK';

      case 'FEEDBACK':
        if (options.retryRequested) {
          return 'QUESTION'; // Retry loop
        }
        return 'PRACTICE';

      case 'PRACTICE':
        return 'CHALLENGE';

      case 'CHALLENGE':
        return 'ASSESS';

      case 'ASSESS':
        return 'REWARD';

      case 'REWARD':
        return 'NEXT';

      case 'NEXT':
        return 'NEXT';

      default:
        return 'EXPLAIN';
    }
  }

  /**
   * Determines the previous pedagogical stage for back navigation.
   */
  public getPreviousStage(currentStage: ClassroomStage): ClassroomStage {
    switch (currentStage) {
      case 'EXPLAIN':
        return 'INTRODUCE';
      case 'DEMONSTRATE':
        return 'EXPLAIN';
      case 'INTERACT':
        return 'DEMONSTRATE';
      case 'QUESTION':
        return 'INTERACT';
      case 'FEEDBACK':
        return 'QUESTION';
      case 'PRACTICE':
        return 'FEEDBACK';
      case 'CHALLENGE':
        return 'PRACTICE';
      case 'ASSESS':
        return 'CHALLENGE';
      case 'REWARD':
        return 'ASSESS';
      case 'NEXT':
        return 'REWARD';
      case 'INTRODUCE':
      default:
        return 'INTRODUCE';
    }
  }

  /**
   * Checks whether the learner can transition to a target stage.
   */
  public canTransitionTo(current: ClassroomStage, target: ClassroomStage): boolean {
    const currentIdx = this.getStageIndex(current);
    const targetIdx = this.getStageIndex(target);

    // Can always move back, or advance by 1 step, or loop between QUESTION and FEEDBACK
    if (targetIdx <= currentIdx + 1) return true;
    if (current === 'FEEDBACK' && target === 'QUESTION') return true;
    return false;
  }
}

export const classroomStageController = new ClassroomStageController();
