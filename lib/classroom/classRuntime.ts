/**
 * Class runtime state — a pure reducer owning ALL lesson-scoped Class state.
 *
 * Why a reducer: previously step index, answer state, Buddy dialogue, Xira
 * directive, session and external visual were scattered across components and
 * were not reset when the concept changed (a concept switch kept the old step;
 * an answered question leaked into the next step's question). Centralising the
 * state here makes the reset rules explicit and unit-testable.
 *
 * Persistence model (intentional):
 *   - Lesson-scoped state (step, answers, hints, feedback, directive, artwork,
 *     session id) is ephemeral. Switching concept A → B → A starts A fresh at
 *     step 1 with no stale answers.
 *   - Learner-scoped data (mastery, XP, attempts, notes) lives in the
 *     persistence layer and is NOT touched by this reducer.
 *
 * Identity rule: every async input (session, directive, external visual) carries
 * a conceptId and is REJECTED unless it matches `state.conceptId`. External
 * visuals must also match the active step and request generation.
 */

import type { ClassroomLesson, ClassroomLessonStep } from '@/components/classroom/types';
import type { BuddyState } from '@/components/buddy/BuddyState';
import type { AdaptiveDirective } from './classroomIntelligence';
import type { ClassIntent } from '@/lib/concepts/types';
import type { SmartBoardVisualPayload } from '@/lib/visualIntelligence/types';
import { acceptVisualPayload } from './visualIdentity';

export interface ClassAnswerState {
  stepId: string;
  selectedOptionId: string | null;
  submitted: boolean;
  isCorrect: boolean | null;
  attempts: number;
}

export interface ClassRuntimeState {
  conceptId: string;
  lessonId: string;
  intent: ClassIntent;
  lesson: ClassroomLesson;
  stepIndex: number;
  /** Increments on every step change; async requests carry it as a token. */
  generation: number;
  answer: ClassAnswerState;
  hintsRevealed: number;
  feedback: { kind: 'correct' | 'incorrect'; text: string } | null;
  directive: { conceptId: string; value: AdaptiveDirective } | null;
  /** Optional AI artwork accepted for the active concept+step. Never replaces the deterministic visual. */
  artwork: { conceptId: string; stepIndex: number; assetUrl: string } | null;
  session: { sessionId: string; conceptId: string } | null;
  completed: boolean;
  /** Diagnostics: count of async inputs rejected by the identity gate. */
  rejectedCount: number;
}

export interface VisualRequestToken {
  conceptId: string;
  stepIndex: number;
  generation: number;
}

export type ClassRuntimeAction =
  | { type: 'INIT'; lesson: ClassroomLesson; intent: ClassIntent }
  | { type: 'GO_TO_STEP'; index: number }
  | { type: 'NEXT_STEP' }
  | { type: 'PREVIOUS_STEP' }
  | { type: 'SELECT_OPTION'; stepId: string; optionId: string }
  | { type: 'SUBMIT_ANSWER'; stepId: string }
  | { type: 'RETRY_ANSWER'; stepId: string }
  | { type: 'REVEAL_HINT' }
  | { type: 'SET_DIRECTIVE'; conceptId: string; directive: AdaptiveDirective | null }
  | { type: 'SESSION_CREATED'; session: { sessionId?: unknown; conceptId?: unknown } | null | undefined }
  | { type: 'EXTERNAL_VISUAL'; token: VisualRequestToken; payload: SmartBoardVisualPayload | null };

function freshAnswer(step: ClassroomLessonStep | undefined): ClassAnswerState {
  return { stepId: step?.id ?? '', selectedOptionId: null, submitted: false, isCorrect: null, attempts: 0 };
}

export function createClassRuntimeState(lesson: ClassroomLesson, intent: ClassIntent): ClassRuntimeState {
  return {
    conceptId: lesson.conceptId,
    lessonId: lesson.id,
    intent,
    lesson,
    stepIndex: 0,
    generation: 0,
    answer: freshAnswer(lesson.steps[0]),
    hintsRevealed: 0,
    feedback: null,
    directive: null,
    artwork: null,
    session: null,
    completed: false,
    rejectedCount: 0,
  };
}

function goToStep(state: ClassRuntimeState, requested: number): ClassRuntimeState {
  const last = state.lesson.steps.length - 1;
  const index = Math.max(0, Math.min(last, Math.trunc(requested)));
  if (index === state.stepIndex) return state;
  return {
    ...state,
    stepIndex: index,
    generation: state.generation + 1,
    answer: freshAnswer(state.lesson.steps[index]),
    hintsRevealed: 0,
    feedback: null,
    directive: null,
    // Artwork belongs to one step; a new step starts with its deterministic visual only.
    artwork: null,
  };
}

export function classRuntimeReducer(state: ClassRuntimeState, action: ClassRuntimeAction): ClassRuntimeState {
  switch (action.type) {
    case 'INIT':
      return createClassRuntimeState(action.lesson, action.intent);

    case 'GO_TO_STEP':
      return goToStep(state, action.index);

    case 'NEXT_STEP':
      if (state.stepIndex >= state.lesson.steps.length - 1) {
        return state.completed ? state : { ...state, completed: true };
      }
      return goToStep(state, state.stepIndex + 1);

    case 'PREVIOUS_STEP':
      return goToStep(state, state.stepIndex - 1);

    case 'SELECT_OPTION': {
      if (action.stepId !== state.answer.stepId || state.answer.submitted) return state;
      const step = state.lesson.steps[state.stepIndex];
      if (!step?.checkQuestion?.options.some((o) => o.id === action.optionId)) return state;
      return { ...state, answer: { ...state.answer, selectedOptionId: action.optionId } };
    }

    case 'SUBMIT_ANSWER': {
      const step = state.lesson.steps[state.stepIndex];
      if (!step?.checkQuestion || action.stepId !== step.id || action.stepId !== state.answer.stepId) return state;
      if (state.answer.submitted || !state.answer.selectedOptionId) return state;
      const option = step.checkQuestion.options.find((o) => o.id === state.answer.selectedOptionId);
      if (!option) return state;
      const script = state.lesson.buddyScript;
      const text = option.isCorrect
        ? script?.correct ?? option.feedback
        : script?.incorrect ?? option.feedback;
      return {
        ...state,
        answer: { ...state.answer, submitted: true, isCorrect: option.isCorrect, attempts: state.answer.attempts + 1 },
        feedback: { kind: option.isCorrect ? 'correct' : 'incorrect', text },
      };
    }

    case 'RETRY_ANSWER':
      if (action.stepId !== state.answer.stepId) return state;
      return {
        ...state,
        answer: { ...state.answer, selectedOptionId: null, submitted: false, isCorrect: null },
        feedback: null,
      };

    case 'REVEAL_HINT':
      return { ...state, hintsRevealed: state.hintsRevealed + 1 };

    case 'SET_DIRECTIVE':
      if (action.conceptId !== state.conceptId) {
        return { ...state, rejectedCount: state.rejectedCount + 1 };
      }
      return { ...state, directive: action.directive ? { conceptId: action.conceptId, value: action.directive } : null };

    case 'SESSION_CREATED': {
      const session = action.session;
      if (!session || typeof session.sessionId !== 'string' || session.conceptId !== state.conceptId) {
        return { ...state, rejectedCount: state.rejectedCount + 1 };
      }
      return { ...state, session: { sessionId: session.sessionId, conceptId: state.conceptId } };
    }

    case 'EXTERNAL_VISUAL': {
      const { token, payload } = action;
      const stale =
        token.conceptId !== state.conceptId ||
        token.stepIndex !== state.stepIndex ||
        token.generation !== state.generation;
      if (stale) return { ...state, rejectedCount: state.rejectedCount + 1 };
      if (!payload) return state;
      const verdict = acceptVisualPayload({ conceptId: state.conceptId, stepIndex: state.stepIndex }, payload);
      if (!verdict.accepted) return { ...state, rejectedCount: state.rejectedCount + 1 };
      if (!payload.assetUrl) return state;
      return { ...state, artwork: { conceptId: state.conceptId, stepIndex: state.stepIndex, assetUrl: payload.assetUrl } };
    }

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export function selectCurrentStep(state: ClassRuntimeState): ClassroomLessonStep {
  return state.lesson.steps[state.stepIndex];
}

export function selectVisualToken(state: ClassRuntimeState): VisualRequestToken {
  return { conceptId: state.conceptId, stepIndex: state.stepIndex, generation: state.generation };
}

/**
 * Buddy dialogue precedence, all from the ACTIVE lesson:
 *   answer feedback → lesson completion → Xira directive (same concept) →
 *   revision opening (step 1, intent=revision) → the step's own dialogue.
 */
export function selectBuddy(state: ClassRuntimeState): { dialogue: string; mood: BuddyState } {
  const step = selectCurrentStep(state);
  if (state.feedback) {
    return { dialogue: state.feedback.text, mood: state.feedback.kind === 'correct' ? 'CORRECT' : 'INCORRECT' };
  }
  if (state.completed && state.lesson.buddyScript?.completion) {
    return { dialogue: state.lesson.buddyScript.completion, mood: 'CELEBRATING' };
  }
  const directiveQuote = state.directive?.conceptId === state.conceptId ? state.directive.value.buddyDirective : undefined;
  if (directiveQuote) {
    return { dialogue: directiveQuote.dialogueQuote, mood: directiveQuote.state };
  }
  if (state.stepIndex === 0 && state.intent === 'revision' && state.lesson.buddyScript?.revisionIntroduction) {
    return { dialogue: state.lesson.buddyScript.revisionIntroduction, mood: 'INTRODUCING' };
  }
  return { dialogue: step.buddyDialogue, mood: step.buddyState };
}

export interface XiraClassContext {
  conceptId: string;
  subject: string;
  topicTitle: string;
  stepId: string;
  stepTitle: string;
  keyIdea: string;
  tryThis?: string;
  hint?: string;
  intent: ClassIntent;
}

export function selectXiraContext(state: ClassRuntimeState): XiraClassContext {
  const step = selectCurrentStep(state);
  return {
    conceptId: state.conceptId,
    subject: state.lesson.subject,
    topicTitle: state.lesson.topicTitle,
    stepId: step.id,
    stepTitle: step.title,
    keyIdea: step.keyPrinciple || step.boardSummary,
    tryThis: step.tryThis,
    hint: step.hintText,
    intent: state.intent,
  };
}
