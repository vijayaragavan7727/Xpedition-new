/**
 * Xpedition Classroom Session Types (Phase 4)
 *
 * Core domain contracts for the stateful classroom session:
 * - Classroom Stages (INTRODUCE -> NEXT)
 * - Session State & Progress
 * - Classroom Telemetry Events
 * - Mastery & Adaptation Models
 */

import { VisualRequirement, SmartBoardVisualPayload, VisualStage } from '../visualIntelligence/types';
import { BuddyState } from '@/components/buddy/BuddyState';
import { QuestionDefinition } from '@/components/classroom/types';

/**
 * The standard sequence of classroom pedagogical stages.
 */
export type ClassroomStage =
  | 'INTRODUCE'
  | 'EXPLAIN'
  | 'DEMONSTRATE'
  | 'INTERACT'
  | 'QUESTION'
  | 'FEEDBACK'
  | 'PRACTICE'
  | 'CHALLENGE'
  | 'ASSESS'
  | 'REWARD'
  | 'NEXT';

/**
 * Standard progression order of classroom stages.
 */
export const CLASSROOM_STAGE_SEQUENCE: readonly ClassroomStage[] = [
  'INTRODUCE',
  'EXPLAIN',
  'DEMONSTRATE',
  'INTERACT',
  'QUESTION',
  'FEEDBACK',
  'PRACTICE',
  'CHALLENGE',
  'ASSESS',
  'REWARD',
  'NEXT',
] as const;

/**
 * Maps ClassroomStage to Phase 3 VisualStage.
 */
export function mapClassroomStageToVisualStage(stage: ClassroomStage): VisualStage {
  switch (stage) {
    case 'INTRODUCE':
      return 'introduce';
    case 'EXPLAIN':
      return 'explain';
    case 'DEMONSTRATE':
      return 'demonstrate';
    case 'INTERACT':
      return 'interact';
    case 'QUESTION':
      return 'question';
    case 'FEEDBACK':
      return 'feedback';
    case 'PRACTICE':
      return 'practice';
    case 'CHALLENGE':
      return 'challenge';
    case 'ASSESS':
      return 'assess';
    case 'REWARD':
      return 'feedback';
    case 'NEXT':
      return 'introduce';
    default:
      return 'explain';
  }
}

/**
 * Deterministic classroom mastery levels.
 */
export type ClassroomMasteryLevel =
  | 'NOT_STARTED'
  | 'INTRODUCED'
  | 'DEVELOPING'
  | 'PRACTICING'
  | 'MASTERED';

/**
 * Learner interaction state inside the classroom.
 */
export interface ClassroomInteractionState {
  hasInteracted: boolean;
  lastInteractionType?: string;
  interactionCount: number;
  activeHotspotId?: string;
  parameters: Record<string, number | string | boolean>;
}

/**
 * Classroom question and evaluation state.
 */
export interface ClassroomQuestionState {
  activeQuestion?: QuestionDefinition;
  selectedOptionId?: string;
  isSubmitted: boolean;
  isCorrect?: boolean;
  attemptNumber: number;
  misconceptionDetected?: string;
  retryAllowed: boolean;
}

/**
 * Contextual Xira intervention surfaced to the learner.
 */
export interface XiraClassroomIntervention {
  type: 'hint' | 'misconception' | 'scaffold' | 'challenge' | 'praise';
  title: string;
  message: string;
  actionLabel?: string;
  remedialStage?: ClassroomStage;
}

/**
 * Structured Classroom Telemetry Event.
 */
export type ClassroomTelemetryEventType =
  | 'CLASS_STARTED'
  | 'STAGE_STARTED'
  | 'STAGE_COMPLETED'
  | 'VISUAL_SHOWN'
  | 'VISUAL_INTERACTED'
  | 'QUESTION_SHOWN'
  | 'QUESTION_ANSWERED'
  | 'ANSWER_CORRECT'
  | 'ANSWER_INCORRECT'
  | 'HINT_REQUESTED'
  | 'RETRY_REQUESTED'
  | 'FEEDBACK_SHOWN'
  | 'CHALLENGE_STARTED'
  | 'CHALLENGE_COMPLETED'
  | 'ASSESSMENT_STARTED'
  | 'ASSESSMENT_COMPLETED'
  | 'REWARD_GRANTED'
  | 'CLASS_COMPLETED';

export interface ClassroomSessionTelemetryEvent {
  eventId: string;
  type: ClassroomTelemetryEventType;
  conceptId: string;
  stage: ClassroomStage;
  timestamp: number;
  data?: Record<string, any>;
}

/**
 * Comprehensive state for a live classroom session.
 */
export interface ClassroomSessionState {
  sessionId: string;
  conceptId: string;
  lessonId: string;
  topicTitle: string;
  subject: string;
  currentStage: ClassroomStage;
  stageIndex: number;
  stageStartedAt: number;
  currentVisualRequirement?: VisualRequirement;
  currentVisualPayload?: SmartBoardVisualPayload;
  interactionState: ClassroomInteractionState;
  questionState: ClassroomQuestionState;
  masteryState: ClassroomMasteryLevel;
  masteryScore: number; // 0 - 100
  telemetry: ClassroomSessionTelemetryEvent[];
  completedStages: ClassroomStage[];
  buddyDialogue: string;
  buddyState: BuddyState;
  xiraIntervention?: XiraClassroomIntervention;
  isVisualLoading: boolean;
  visualError?: string;
  nextRecommendedConceptId?: string;
}

/**
 * Action taken by the learner to transition or interact with the class.
 */
export type ClassroomLearnerAction =
  | { type: 'ADVANCE_STAGE' }
  | { type: 'PREVIOUS_STAGE' }
  | { type: 'INTERACT_VISUAL'; interactionType: string; payload?: Record<string, any> }
  | { type: 'ANSWER_QUESTION'; optionId: string }
  | { type: 'RETRY_QUESTION' }
  | { type: 'REQUEST_HINT' }
  | { type: 'COMPLETE_CHALLENGE'; outcome: 'success' | 'partial' | 'failure' }
  | { type: 'COMPLETE_ASSESSMENT'; isCorrect: boolean }
  | { type: 'CLAIM_REWARD' }
  | { type: 'SELECT_NEXT_CONCEPT'; nextConceptId: string };
