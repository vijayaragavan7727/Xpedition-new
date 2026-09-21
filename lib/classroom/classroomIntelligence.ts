/**
 * Xpedition Phase 3 — Classroom Adaptive Intelligence Service
 *
 * Connects the Digital Classroom (Buddy + Smart Board + Toolkit)
 * to the canonical Intelligence Architecture:
 *
 * CLASSROOM TELEMETRY (Questions, Hints, Flashcards, Steps)
 *  ↓
 * LEARNER MODEL UPDATE (Attempts, BKT, theta, retention risk)
 *  ↓
 * MISCONCEPTION & GAP DETECTION (Deterministic, 0 AI tokens)
 *  ↓
 * DECISION ENGINE (Authoritative Next Best Action)
 *  ↓
 * ADAPTIVE DIRECTIVES (Smart Board Remedial Callouts + Buddy Companion Reactions + Xira Grounding)
 *
 * Guarantees:
 * 1. Zero AI provider calls to decide pedagogical interventions (100% deterministic).
 * 2. Reuses canonical DecisionEngine, contextMapper, and BKT calculations.
 * 3. Does not fabricate mastery or XP.
 * 4. Preserves World, Auth, and Security invariants.
 */

import {
  LearnerState,
  NextBestAction,
  AssessmentSignal,
} from '../intelligence/types';
import { defaultDecisionEngine, DecisionEngine } from '../intelligence/decisionEngine';
import { mapStoreToLearnerState } from '../intelligence/contextMapper';
import { getStoreData, UserStoreData } from '../store';
import { BuddyState } from '../../components/buddy/BuddyState';

export interface ClassroomTelemetryEvent {
  eventType: 'question_attempt' | 'hint_requested' | 'flashcard_reviewed' | 'step_completed';
  conceptId: string;
  conceptName: string;
  stepIndex?: number;
  stepTitle?: string;
  timestamp: number;
  data?: {
    questionId?: string;
    isCorrect?: boolean;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    misconceptionTag?: string;
    attemptNumber?: number;
    chosenOptionId?: string;
    hintStage?: number;
    cardId?: string;
    cardStatus?: 'KNOWN' | 'REVIEW';
  };
}

export interface AdaptiveDirective {
  signal: AssessmentSignal;
  detectedMisconception?: string;
  recommendedAction: NextBestAction;
  smartBoardCallout?: {
    type: 'remedial' | 'scaffold' | 'challenge' | 'retention';
    title: string;
    message: string;
    actionLabel?: string;
  };
  buddyDirective?: {
    state: BuddyState;
    dialogueQuote: string;
  };
}

export interface ClassroomIntelligenceState {
  conceptId: string;
  conceptName: string;
  recentAttemptsCount: number;
  recentMistakesCount: number;
  activeMisconceptionTag?: string;
  hintsUsedCount: number;
  cardsNeedReviewCount: number;
  masteryPercentage: number;
  activeDirective?: AdaptiveDirective;
  lastEvaluatedAt: number;
}

export class ClassroomIntelligenceService {
  private stateCache: Map<string, ClassroomIntelligenceState> = new Map();

  constructor(private decisionEngine: DecisionEngine = defaultDecisionEngine) {}

  /**
   * Retrieves or initializes the intelligence state for a given concept.
   */
  getIntelligenceState(conceptId: string, conceptName: string): ClassroomIntelligenceState {
    if (!this.stateCache.has(conceptId)) {
      const initial: ClassroomIntelligenceState = {
        conceptId,
        conceptName,
        recentAttemptsCount: 0,
        recentMistakesCount: 0,
        hintsUsedCount: 0,
        cardsNeedReviewCount: 0,
        masteryPercentage: 50,
        lastEvaluatedAt: Date.now(),
      };
      this.stateCache.set(conceptId, initial);
    }
    return this.stateCache.get(conceptId)!;
  }

  /**
   * Ingests live telemetry from classroom activities and computes adaptive directives.
   */
  processTelemetry(
    event: ClassroomTelemetryEvent,
    storeData?: Partial<UserStoreData>
  ): AdaptiveDirective | null {
    const currentState = this.getIntelligenceState(event.conceptId, event.conceptName);

    // 1. Update live interaction counters
    if (event.eventType === 'question_attempt' && event.data) {
      currentState.recentAttemptsCount += 1;
      if (!event.data.isCorrect) {
        currentState.recentMistakesCount += 1;
        if (event.data.misconceptionTag) {
          currentState.activeMisconceptionTag = event.data.misconceptionTag;
        }
      } else {
        // Successful attempt reduces mistake pressure
        if (currentState.recentMistakesCount > 0) {
          currentState.recentMistakesCount -= 1;
        }
      }
    } else if (event.eventType === 'hint_requested') {
      currentState.hintsUsedCount += 1;
    } else if (event.eventType === 'flashcard_reviewed' && event.data?.cardStatus === 'REVIEW') {
      currentState.cardsNeedReviewCount += 1;
    }

    currentState.lastEvaluatedAt = Date.now();

    // 2. Synthesize normalized LearnerState
    const rawStore = storeData || (typeof window !== 'undefined' ? getStoreData() : undefined);
    const baseLearnerState = mapStoreToLearnerState(rawStore, event.conceptId);

    const mergedLearnerState: Partial<LearnerState> = {
      ...baseLearnerState,
      currentConceptId: event.conceptId,
      currentConceptName: event.conceptName,
      recentMistakeCount: currentState.recentMistakesCount,
      repeatedMistakes: currentState.recentMistakesCount >= 2,
    };

    // 3. Resolve Next Best Action deterministically via canonical DecisionEngine
    const nextAction = this.decisionEngine.decideNextAction(mergedLearnerState);

    // 4. Derive Adaptive Directive based on pedagogical signals
    let directive: AdaptiveDirective | null = null;

    // A. Active Misconception Detected
    if (currentState.recentMistakesCount > 0 && currentState.activeMisconceptionTag) {
      directive = {
        signal: 'MISCONCEPTION',
        detectedMisconception: currentState.activeMisconceptionTag,
        recommendedAction: nextAction,
        smartBoardCallout: {
          type: 'remedial',
          title: 'Adaptive Focus: Mental Model Adjustment',
          message: this.getMisconceptionClarification(currentState.activeMisconceptionTag),
          actionLabel: 'Review Mechanism',
        },
        buddyDirective: {
          state: 'THINKING',
          dialogueQuote: 'Notice what is happening here. Let us trace the physical connection step by step.',
        },
      };
    }
    // B. Knowledge Gap / Repeated Hint Struggle
    else if (currentState.hintsUsedCount >= 2 && currentState.recentMistakesCount > 0) {
      directive = {
        signal: 'KNOWLEDGE_GAP',
        recommendedAction: nextAction,
        smartBoardCallout: {
          type: 'scaffold',
          title: 'Teacher Guidance Active',
          message: 'Break this down into fundamental variables. Use the progressive hints or formula sheet for structural support.',
          actionLabel: 'Open Hints',
        },
        buddyDirective: {
          state: 'ENCOURAGING',
          dialogueQuote: 'Taking it one layer at a time is how deep mastery happens. Keep going!',
        },
      };
    }
    // C. Retention Alert from Flashcards
    else if (currentState.cardsNeedReviewCount >= 2) {
      directive = {
        signal: 'RECALL_FAILURE',
        recommendedAction: nextAction,
        smartBoardCallout: {
          type: 'retention',
          title: 'Spaced Recall Recommendation',
          message: `${currentState.cardsNeedReviewCount} key terms flagged for review. Revisit flashcards at the end of class to reinforce memory.`,
          actionLabel: 'View Flashcards',
        },
        buddyDirective: {
          state: 'WAITING',
          dialogueQuote: 'Reviewing key vocabulary cements these mental models in long-term memory.',
        },
      };
    }
    // D. Strong Mastery Achieved
    else if (
      event.eventType === 'question_attempt' &&
      event.data?.isCorrect &&
      currentState.recentMistakesCount === 0 &&
      currentState.recentAttemptsCount >= 1
    ) {
      directive = {
        signal: 'STRONG_MASTERY',
        recommendedAction: nextAction,
        smartBoardCallout: {
          type: 'challenge',
          title: 'Mastery Confirmed',
          message: 'Excellent conceptual grasp! You are ready to advance to the next application or complete the lesson.',
          actionLabel: 'Next Step',
        },
        buddyDirective: {
          state: 'CELEBRATING',
          dialogueQuote: 'Spot on! That demonstrates exactly how the core principles fit together.',
        },
      };
    }

    currentState.activeDirective = directive || undefined;
    return directive;
  }

  /**
   * Deterministic pedagogical explanations for known misconception tags.
   */
  private getMisconceptionClarification(tag: string): string {
    const map: Record<string, string> = {
      commutator_vs_brushes:
        'Commutator vs Brushes: The brushes are stationary carbon contacts. The split ring commutator is the rotating switch that reverses polarity every 180° to sustain rotation.',
      linear_vs_quadratic_torque:
        'Torque Linearity: Electromagnetic torque τ = N·I·A·B·sin(α) scales linearly with current (power of 1), not quadratically.',
      continuous_force_inversion:
        'Counter-Torque Trap: Without current reversal at 90°, magnetic Lorentz forces act in the reverse rotational sense, causing the coil to oscillate and halt.',
      horizontal_gravity_myth:
        'Gravity Vector: Gravitational acceleration acts strictly downward along the vertical y-axis (a_y = -9.8 m/s²). The horizontal acceleration is exactly zero (a_x = 0).',
      complementary_range:
        'Complementary Trajectories: Angles that sum to 90° (such as 30° and 60°) produce the exact same horizontal range because sin(2θ) yields identical values.',
      volume_vs_pressure_hypertrophy:
        'Ventricular Afterload: The left ventricle is thicker because it must overcome systemic arterial resistance (~120 mmHg) to perfuse the entire body, not because it holds more volume.',
    };

    return map[tag] || 'Review the core mechanism on the Smart Board to observe how cause and effect connect.';
  }

  /**
   * Clears state for testing or session reset.
   */
  resetState(conceptId?: string) {
    if (conceptId) {
      this.stateCache.delete(conceptId);
    } else {
      this.stateCache.clear();
    }
  }
}

export const defaultClassroomIntelligence = new ClassroomIntelligenceService();
