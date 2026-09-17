/**
 * Learner Model Integration Adapter
 *
 * Emits structured evidence from experiential learning interactions to the
 * canonical Xpedition store (`recordAttempt`) and feedback loop (`processLearningOutcome`).
 *
 * Guarantees:
 * 1. Zero duplicate BKT, theta, or mastery calculations.
 * 2. Pure integration adapter around existing systems.
 * 3. Does NOT mutate protected files.
 */

import { ExperienceLearnerEvidence } from '../types';
import { recordAttempt, Attempt } from '../../store';
import { processLearningOutcome } from '../../intelligence/feedbackLoop';

export class LearnerModelAdapter {
  /**
   * Translates experiential learning evidence into an Attempt record and updates
   * the canonical store and Decision Engine.
   */
  static recordExperienceOutcome(evidence: ExperienceLearnerEvidence): {
    attempt: Attempt;
    nextAction?: any;
  } {
    const attempt: Attempt = {
      id: `exp_att_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      conceptId: evidence.conceptId,
      conceptName: evidence.conceptName,
      isCorrect: evidence.isSuccess,
      timestamp: evidence.timestamp || Date.now(),
      confidence: evidence.confidence,
      isSolo: false,
      itemHash: `exp_${evidence.conceptId}_${evidence.trialsCount}_trials`,
    };

    // 1. Update canonical store (which safely runs updateTheta)
    const updatedStore = typeof window !== 'undefined' ? recordAttempt(attempt) : undefined;

    // 2. Feed into canonical Decision Engine feedback loop
    let nextAction = undefined;
    try {
      const feedbackResult = processLearningOutcome(
        {
          conceptId: evidence.conceptId,
          itemId: attempt.itemHash,
          correct: evidence.isSuccess,
          confidence: evidence.confidence,
          source: 'QUEST',
          timestamp: attempt.timestamp,
          attemptId: attempt.id,
        },
        updatedStore
      );
      nextAction = feedbackResult?.nextBestAction;
    } catch (err) {
      console.warn('[LearnerModelAdapter] Feedback loop evaluation skipped:', err);
    }

    // 3. Asynchronously persist attempt and updated mastery to persistence layer
    try {
      const { persistenceManager } = require('../../persistence');
      persistenceManager.recordAttempt(attempt, evidence.conceptId, evidence.conceptName).catch((pErr: any) => {
        console.warn('[LearnerModelAdapter] Async persistence dispatch warning:', pErr);
      });
    } catch {
      // ignore in environments where dynamic require is restricted
    }

    return {
      attempt,
      nextAction,
    };
  }
}
