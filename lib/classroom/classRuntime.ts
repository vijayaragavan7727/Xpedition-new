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
  /** True when the learner asked to see the answer (after REVEAL_AFTER_ATTEMPTS wrong attempts). */
  revealed?: boolean;
}

/**
 * What the learner actually did on one step. This is the ONLY source for
 * Xira's observations, the completion summary and the progress badge: nothing
 * is inferred from merely clicking Next.
 */
export interface StepEvidence {
  stepId: string;
  attempts: number;
  wrongOptionIds: string[];
  /** null until the first attempt. */
  firstTryCorrect: boolean | null;
  /** How the step's check ended: answered correctly, or answer shown. */
  resolution: 'correct' | 'revealed' | null;
  hintsUsed: number;
  /** Smart Board activity on this step (trace, ordering, location challenge), when the step has one. */
  activity?: { completed: boolean; wrong: number };
}

/** Kind of hands-on Smart Board activity a step contains, derived from its own visual data. */
export type BoardActivityKind = 'trace' | 'order' | 'challenge';

export function stepActivityKind(step: ClassroomLessonStep | undefined): BoardActivityKind | null {
  const data = (step?.visualData ?? {}) as { mode?: string; order?: unknown };
  if (data.mode === 'trace') return 'trace';
  if (data.mode === 'challenge') return 'challenge';
  if (Array.isArray(data.order) && data.order.length > 0) return 'order';
  return null;
}

/** Wrong attempts required before the learner may choose to see the answer. */
export const REVEAL_AFTER_ATTEMPTS = 2;

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
  feedback: { kind: 'correct' | 'incorrect' | 'revealed'; text: string } | null;
  /** Per-step learner evidence for this class visit (keyed by step id). */
  evidence: Record<string, StepEvidence>;
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
  | { type: 'REVEAL_ANSWER'; stepId: string }
  | { type: 'REVEAL_HINT' }
  | { type: 'BOARD_ACTIVITY'; stepId: string; completed: boolean; wrong: number }
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
    evidence: {},
    directive: null,
    artwork: null,
    session: null,
    completed: false,
    rejectedCount: 0,
  };
}

function blankEvidence(stepId: string): StepEvidence {
  return { stepId, attempts: 0, wrongOptionIds: [], firstTryCorrect: null, resolution: null, hintsUsed: 0 };
}

export function correctOptionOf(step: ClassroomLessonStep | undefined) {
  return step?.checkQuestion?.options.find((o) => o.isCorrect);
}

/** A step's check is resolved once answered correctly or its answer was shown. */
export function isStepResolved(state: ClassRuntimeState, index: number): boolean {
  const step = state.lesson.steps[index];
  if (!step?.checkQuestion) return true;
  return Boolean(state.evidence[step.id]?.resolution);
}

/**
 * Furthest step the learner may open: the first step whose check is still
 * unresolved. Learning is by doing — a check cannot be skipped by clicking Next
 * or by jumping ahead on the step dots.
 */
export function maxReachableStep(state: ClassRuntimeState): number {
  for (let i = 0; i < state.lesson.steps.length; i++) {
    if (!isStepResolved(state, i)) return i;
  }
  return state.lesson.steps.length - 1;
}

/** The answer state to show when (re)entering a step: resolved checks stay resolved. */
function answerOnEntry(state: ClassRuntimeState, step: ClassroomLessonStep | undefined): ClassAnswerState {
  const fresh = freshAnswer(step);
  const ev = step ? state.evidence[step.id] : undefined;
  if (!step || !ev) return fresh;
  if (ev.resolution) {
    return {
      ...fresh,
      selectedOptionId: correctOptionOf(step)?.id ?? null,
      submitted: true,
      isCorrect: ev.resolution === 'correct',
      attempts: ev.attempts,
      revealed: ev.resolution === 'revealed',
    };
  }
  return { ...fresh, attempts: ev.attempts };
}

function hintForAttempt(step: ClassroomLessonStep, wrongAttempts: number): string | undefined {
  // wrongAttempts 2 → first hint, 3 → second hint, …
  const progressive = step.progressiveHint?.hints ?? [];
  return progressive[wrongAttempts - 2] ?? progressive[progressive.length - 1] ?? step.hintText;
}

/** Removes a leading "Correct." style prefix so an explanation can be reused when the answer is SHOWN. */
function explanationOnly(feedback: string): string {
  return feedback.replace(/^(correct|spot on|perfect|exactly( right)?)[.!]?\s*/i, '').trim();
}

function goToStep(state: ClassRuntimeState, requested: number): ClassRuntimeState {
  const last = state.lesson.steps.length - 1;
  const index = Math.max(0, Math.min(last, maxReachableStep(state), Math.trunc(requested)));
  if (index === state.stepIndex) return state;
  return {
    ...state,
    stepIndex: index,
    generation: state.generation + 1,
    answer: answerOnEntry(state, state.lesson.steps[index]),
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
      // A check must be answered (or its answer shown) before moving on.
      if (!isStepResolved(state, state.stepIndex)) return state;
      if (state.stepIndex >= state.lesson.steps.length - 1) {
        // Completing clears the last answer feedback so the evidence-based summary is shown.
        return state.completed ? state : { ...state, completed: true, feedback: null };
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
      const prev = state.evidence[step.id] ?? blankEvidence(step.id);
      if (prev.resolution) return state;
      const attempts = prev.attempts + 1;
      const wrongOptionIds = option.isCorrect ? prev.wrongOptionIds : [...prev.wrongOptionIds, option.id];
      const evidence: StepEvidence = {
        ...prev,
        attempts,
        wrongOptionIds,
        firstTryCorrect: prev.firstTryCorrect ?? option.isCorrect,
        resolution: option.isCorrect ? 'correct' : null,
      };
      // Buddy answers THIS question: the chosen option's own explanation. From the
      // second wrong attempt on, the step's hint is added (progressive scaffold).
      let text = option.feedback;
      if (!option.isCorrect && wrongOptionIds.length >= 2) {
        const hint = hintForAttempt(step, wrongOptionIds.length);
        if (hint) text = `${option.feedback} Hint: ${hint}`;
      }
      return {
        ...state,
        answer: { ...state.answer, submitted: true, isCorrect: option.isCorrect, attempts },
        feedback: { kind: option.isCorrect ? 'correct' : 'incorrect', text },
        evidence: { ...state.evidence, [step.id]: evidence },
      };
    }

    case 'RETRY_ANSWER': {
      if (action.stepId !== state.answer.stepId) return state;
      // Retrying is for a wrong answer that has not been resolved.
      if (!state.answer.submitted || state.answer.isCorrect || state.evidence[action.stepId]?.resolution) return state;
      return {
        ...state,
        answer: { ...state.answer, selectedOptionId: null, submitted: false, isCorrect: null },
        feedback: null,
      };
    }

    case 'REVEAL_ANSWER': {
      const step = state.lesson.steps[state.stepIndex];
      if (!step?.checkQuestion || action.stepId !== step.id) return state;
      const prev = state.evidence[step.id] ?? blankEvidence(step.id);
      if (prev.resolution || prev.wrongOptionIds.length < REVEAL_AFTER_ATTEMPTS) return state;
      const correct = correctOptionOf(step);
      if (!correct) return state;
      return {
        ...state,
        answer: { ...state.answer, selectedOptionId: correct.id, submitted: true, isCorrect: false, revealed: true },
        feedback: { kind: 'revealed', text: `The answer is “${correct.text}”. ${explanationOnly(correct.feedback)}`.trim() },
        evidence: { ...state.evidence, [step.id]: { ...prev, resolution: 'revealed' } },
      };
    }

    case 'BOARD_ACTIVITY': {
      const step = state.lesson.steps[state.stepIndex];
      // Only the active step's own activity is recorded (stale events are ignored).
      if (!step || action.stepId !== step.id || !stepActivityKind(step)) return state;
      const prev = state.evidence[step.id] ?? blankEvidence(step.id);
      const already = prev.activity?.completed ?? false;
      return {
        ...state,
        evidence: {
          ...state.evidence,
          [step.id]: { ...prev, activity: { completed: already || action.completed, wrong: Math.max(prev.activity?.wrong ?? 0, action.wrong) } },
        },
      };
    }

    case 'REVEAL_HINT': {
      const step = state.lesson.steps[state.stepIndex];
      const prev = (step && state.evidence[step.id]) || blankEvidence(step?.id ?? '');
      return {
        ...state,
        hintsRevealed: state.hintsRevealed + 1,
        evidence: step ? { ...state.evidence, [step.id]: { ...prev, hintsUsed: prev.hintsUsed + 1 } } : state.evidence,
      };
    }

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

export interface LessonEvidenceSummary {
  totalChecks: number;
  answered: number;
  firstTryCorrect: number;
  correctAfterRetry: number;
  revealed: number;
  hintsUsed: number;
  /** Hands-on Smart Board activities in the lesson, and how many the learner completed. */
  activitiesTotal: number;
  activitiesCompleted: number;
  /** Steps whose check was not answered correctly on the first try (for review). */
  review: Array<{ index: number; title: string; outcome: 'after_retry' | 'revealed' | 'activity_skipped' }>;
}

export function selectEvidenceSummary(state: ClassRuntimeState): LessonEvidenceSummary {
  const summary: LessonEvidenceSummary = {
    totalChecks: 0,
    answered: 0,
    firstTryCorrect: 0,
    correctAfterRetry: 0,
    revealed: 0,
    hintsUsed: 0,
    activitiesTotal: 0,
    activitiesCompleted: 0,
    review: [],
  };
  state.lesson.steps.forEach((step, index) => {
    const ev = state.evidence[step.id];
    summary.hintsUsed += ev?.hintsUsed ?? 0;
    if (stepActivityKind(step)) {
      summary.activitiesTotal += 1;
      if (ev?.activity?.completed) summary.activitiesCompleted += 1;
      else if (index <= state.stepIndex && (state.completed || index < state.stepIndex)) {
        summary.review.push({ index, title: step.title, outcome: 'activity_skipped' });
      }
    }
    if (!step.checkQuestion) return;
    summary.totalChecks += 1;
    if (!ev?.resolution) return;
    summary.answered += 1;
    if (ev.resolution === 'revealed') {
      summary.revealed += 1;
      summary.review.push({ index, title: step.title, outcome: 'revealed' });
    } else if (ev.firstTryCorrect) {
      summary.firstTryCorrect += 1;
    } else {
      summary.correctAfterRetry += 1;
      summary.review.push({ index, title: step.title, outcome: 'after_retry' });
    }
  });
  return summary;
}

/** True while a predict-first step is waiting for the learner's first answer. */
export function isPredicting(state: ClassRuntimeState): boolean {
  const step = selectCurrentStep(state);
  if (!step?.predict || !step.checkQuestion) return false;
  return !state.evidence[step.id]?.attempts;
}

/** What the Smart Board shows for the active step (predict-first aware). */
export function selectBoardView(state: ClassRuntimeState): { title: string; summary: string; showKeyPrinciple: boolean; predicting: boolean } {
  const step = selectCurrentStep(state);
  const predicting = isPredicting(state);
  return {
    title: predicting && step.predict?.boardTitle ? step.predict.boardTitle : step.boardTitle,
    summary: predicting && step.predict?.boardSummary ? step.predict.boardSummary : step.boardSummary,
    showKeyPrinciple: !predicting,
    predicting,
  };
}

/**
 * Buddy dialogue precedence, all from the ACTIVE lesson and the learner's own
 * answers (no generic filler, no praise that was not earned):
 *   answer feedback → completion (evidence-based) → predict-first prompt →
 *   revision opening (step 1, intent=revision) → the step's own dialogue.
 */
export function selectBuddy(state: ClassRuntimeState): { dialogue: string; mood: BuddyState } {
  const step = selectCurrentStep(state);
  if (state.feedback) {
    const mood: BuddyState =
      state.feedback.kind === 'correct' ? 'CORRECT' : state.feedback.kind === 'incorrect' ? 'INCORRECT' : 'EXPLAINING';
    return { dialogue: state.feedback.text, mood };
  }
  if (state.completed) {
    const s = selectEvidenceSummary(state);
    const allActivities = s.activitiesCompleted === s.activitiesTotal;
    if ((s.totalChecks === 0 || s.firstTryCorrect === s.totalChecks) && allActivities) {
      if (state.lesson.buddyScript?.completion) return { dialogue: state.lesson.buddyScript.completion, mood: 'CELEBRATING' };
    }
    const parts = [`You finished ${state.lesson.topicTitle}.`, `First-try correct: ${s.firstTryCorrect} of ${s.totalChecks} checks.`];
    if (s.activitiesTotal > 0) parts.push(`Board activities completed: ${s.activitiesCompleted} of ${s.activitiesTotal}.`);
    if (s.review.length > 0) parts.push(`Review: ${s.review.map((r) => r.title).join(', ')}.`);
    return { dialogue: parts.join(' '), mood: 'ENCOURAGING' };
  }
  if (isPredicting(state) && step.predict) {
    return { dialogue: step.predict.dialogue, mood: 'THINKING' };
  }
  if (state.stepIndex === 0 && state.intent === 'revision' && state.lesson.buddyScript?.revisionIntroduction) {
    return { dialogue: state.lesson.buddyScript.revisionIntroduction, mood: 'INTRODUCING' };
  }
  return { dialogue: step.buddyDialogue, mood: step.buddyState };
}

/**
 * Xira's observation, computed ONLY from what the learner did in this class
 * (attempts, wrong options, hints, reveals). Deterministic and lesson-owned: the
 * likely misconception is the step's authored common mistake, the alternative
 * representation is the step's own board activity. No generated text.
 */
export interface XiraObservation {
  kind: 'misconception' | 'scaffold' | 'on_track' | 'review' | 'answer_shown' | 'summary';
  title: string;
  message: string;
  detail?: string;
  action?: { kind: 'hint' | 'reveal_answer' | 'revisit'; label: string; stepIndex?: number };
  /** Steps to revisit (completion summary). */
  revisit?: Array<{ index: number; title: string }>;
}

export function selectXiraObservation(state: ClassRuntimeState): XiraObservation | null {
  const step = selectCurrentStep(state);
  const summary = selectEvidenceSummary(state);
  if (state.completed) {
    if (summary.totalChecks === 0) return null;
    return {
      kind: 'summary',
      title: 'Your evidence from this class',
      message: `First try: ${summary.firstTryCorrect}/${summary.totalChecks}. After retry: ${summary.correctAfterRetry}. Answer shown: ${summary.revealed}. Hints used: ${summary.hintsUsed}.${
        summary.activitiesTotal > 0 ? ` Board activities: ${summary.activitiesCompleted}/${summary.activitiesTotal}.` : ''
      }`,
      detail:
        summary.review.length === 0
          ? 'Every check was correct on the first attempt and every board activity was completed.'
          : 'These steps need another look before this concept counts as mastered:',
      revisit: summary.review.map((r) => ({ index: r.index, title: r.title })),
    };
  }
  if (!step?.checkQuestion) return null;
  const ev = state.evidence[step.id];
  if (!ev || ev.attempts === 0) return null;

  if (ev.resolution === 'revealed') {
    return {
      kind: 'answer_shown',
      title: 'Answer shown',
      message: 'This check is not counted as correct. It is listed for review at the end of the class.',
      detail: step.commonMistake,
    };
  }
  if (ev.resolution === 'correct') {
    if (ev.firstTryCorrect) {
      const onStreak = summary.answered >= 2 && summary.firstTryCorrect === summary.answered;
      return {
        kind: 'on_track',
        title: 'Correct on the first attempt',
        message: onStreak
          ? `All ${summary.answered} checks so far were right first time. You are ready for the next, harder step.`
          : 'Keep going. The next step builds on this.',
      };
    }
    return {
      kind: 'review',
      title: `Correct after ${ev.attempts} attempts`,
      message: 'Good recovery. This step is listed for a quick review at the end so the idea sticks.',
      detail: step.commonMistake,
    };
  }
  // Unresolved, at least one wrong answer.
  const wrong = ev.wrongOptionIds.length;
  if (wrong >= REVEAL_AFTER_ATTEMPTS) {
    return {
      kind: 'scaffold',
      title: `${wrong} attempts so far`,
      message: step.tryThis ? `Try a different route: ${step.tryThis}` : 'Re-read the step on the board, then try again.',
      detail: step.commonMistake,
      action: { kind: 'reveal_answer', label: 'Show me the answer and why' },
    };
  }
  const hint = step.progressiveHint?.hints?.[0] ?? step.hintText;
  return {
    kind: 'misconception',
    // The lesson authors one common mistake per step (not per option), so the
    // title says exactly that rather than claiming to diagnose this answer.
    title: step.commonMistake ? 'Common mistake at this step' : 'Check your reasoning',
    message: step.commonMistake ?? 'Compare your choice with the idea on the board before retrying.',
    detail: ev.hintsUsed > 0 && hint ? `Hint: ${hint}` : step.tryThis ? `Check it on the board: ${step.tryThis}` : undefined,
    action: hint && ev.hintsUsed === 0 ? { kind: 'hint', label: 'Show a hint' } : undefined,
  };
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
