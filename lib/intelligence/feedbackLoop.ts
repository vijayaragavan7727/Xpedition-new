/**
 * Xpedition Intelligence Layer v1 — Real Learning Feedback Loop
 *
 * Connects learning interaction outcomes back into learner state and the Decision Engine
 * so that Xpedition dynamically updates the Next Best Action.
 *
 * Core Cycle:
 * Learner Activity -> Answer -> Store update (BKT/theta/XP/attempts) ->
 * FeedbackLoop (observes updated store) -> canonical contextMapper ->
 * canonical Decision Engine -> NextBestAction -> Activity -> repeat.
 *
 * Guarantees:
 * 1. Zero duplicate mastery, BKT, XP, or confidence calculations.
 * 2. State updates in UserStoreData occur FIRST before intelligence evaluation.
 * 3. Exact reuse of canonical mapStoreToLearnerState and DecisionEngine.
 * 4. Deduplication protection against duplicate event processing.
 * 5. Zero AI provider calls for feedback calculation (local, deterministic, fast).
 */

import { NextBestAction } from './types';
import { DecisionEngine, defaultDecisionEngine } from './decisionEngine';
import { mapStoreToLearnerState } from './contextMapper';
import { getStoreData, UserStoreData } from '../store';

export type LearningOutcomeSource = 'QUEST' | 'TUTOR' | 'REVIEW' | 'CHALLENGE' | 'MOCK';

export interface LearningOutcomeEvent {
  conceptId: string;
  itemId?: string;
  itemHash?: string;
  correct: boolean;
  confidence?: 'known' | 'unsure' | 'guess';
  source: LearningOutcomeSource;
  timestamp: number;
  sessionId?: string;
  attemptId?: string;
}

export interface FeedbackLoopResult {
  nextBestAction: NextBestAction;
  event: LearningOutcomeEvent;
  isDuplicate: boolean;
  evaluatedAt: number;
}

export class FeedbackLoopService {
  private processedEvents = new Map<string, { result: NextBestAction; timestamp: number }>();
  private maxCacheSize = 200;

  constructor(private engine: DecisionEngine = defaultDecisionEngine) {}

  /**
   * Generates a deterministic deduplication key for a learning outcome event.
   */
  private getEventKey(event: LearningOutcomeEvent): string {
    if (event.attemptId) {
      return `attempt_${event.attemptId}`;
    }
    if (event.sessionId && event.itemId) {
      return `session_${event.sessionId}_item_${event.itemId}_ts_${event.timestamp}`;
    }
    const itemRef = event.itemHash || event.itemId || 'generic';
    return `src_${event.source}_concept_${event.conceptId}_item_${itemRef}_ts_${event.timestamp}`;
  }

  /**
   * Processes an already recorded learning outcome and evaluates the Next Best Action
   * from the freshly updated UserStoreData.
   *
   * @param event The typed outcome event from the learning interaction.
   * @param updatedStoreData Optional freshly updated UserStoreData (if already returned by recordAttempt).
   */
  processLearningOutcome(
    event: LearningOutcomeEvent,
    updatedStoreData?: Partial<UserStoreData>
  ): FeedbackLoopResult {
    const eventKey = this.getEventKey(event);

    // 1. Deduplication Check
    if (this.processedEvents.has(eventKey)) {
      const cached = this.processedEvents.get(eventKey)!;
      return {
        nextBestAction: cached.result,
        event,
        isDuplicate: true,
        evaluatedAt: cached.timestamp,
      };
    }

    // 2. Read updated store state (must be post-mutation)
    const storeData = updatedStoreData || (typeof window !== 'undefined' ? getStoreData() : undefined);

    // 3. Project updated learner state using canonical contextMapper
    const learnerState = mapStoreToLearnerState(storeData, event.conceptId);

    // 4. Resolve Next Best Action using canonical Decision Engine
    const nextBestAction = this.engine.decideNextAction(learnerState);

    // 5. Store in deduplication cache with LRU cleanup
    if (this.processedEvents.size >= this.maxCacheSize) {
      const oldestKey = this.processedEvents.keys().next().value;
      if (oldestKey) {
        this.processedEvents.delete(oldestKey);
      }
    }
    this.processedEvents.set(eventKey, {
      result: nextBestAction,
      timestamp: Date.now(),
    });

    return {
      nextBestAction,
      event,
      isDuplicate: false,
      evaluatedAt: Date.now(),
    };
  }

  /**
   * Clears the deduplication cache (useful for testing or session reset).
   */
  clearCache(): void {
    this.processedEvents.clear();
  }
}

// Global singleton instance
export const defaultFeedbackLoop = new FeedbackLoopService();

/**
 * Convenience helper to process a learning outcome through the global feedback loop.
 */
export function processLearningOutcome(
  event: LearningOutcomeEvent,
  updatedStoreData?: Partial<UserStoreData>
): FeedbackLoopResult {
  return defaultFeedbackLoop.processLearningOutcome(event, updatedStoreData);
}
