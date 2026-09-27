/**
 * Xpedition Digital Classroom Foundation — Types
 *
 * Core abstractions for the real classroom experience:
 * 🤖 Buddy = 3D Robot Teacher
 * 🖥️ Smart Board = Primary Teaching Surface
 * ✨ Xira = Contextual Doubt/Adaptive Assistant
 * 📚 Learning Tools = Lesson, Questions, Audio, Hint, Notes, Formula Sheet, Flashcards, Sources
 */

import { BuddyState } from '@/components/buddy/BuddyState';

export type ClassroomToolType =
  | 'lesson'
  | 'questions'
  | 'audio'
  | 'hint'
  | 'notes'
  | 'formula'
  | 'flashcards'
  | 'sources';

export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
  feedback: string;
}

export interface QuestionDefinition {
  id: string;
  lessonId: string;
  conceptId: string;
  prompt: string;
  type: 'multiple_choice' | 'true_false' | 'conceptual' | 'application';
  difficulty: QuestionDifficulty;
  options: QuestionOption[];
  explanation: string;
  misconceptionTag?: string;
  hint?: ProgressiveHint;
}

export interface ProgressiveHint {
  id: string;
  stepId?: string;
  conceptId: string;
  hints: string[]; // [Hint 1: conceptual nudge, Hint 2: specific direction, Hint 3: scaffold]
}

export interface UserClassroomNote {
  id: string;
  userId?: string;
  conceptId: string;
  topicTitle: string;
  content: string;
  updatedAt: number;
}

export interface ClassroomLessonStep {
  id: string;
  stepNumber: number;
  title: string;
  subtitle?: string;
  buddyDialogue: string;
  buddyState: BuddyState;
  boardTitle: string;
  boardSummary: string;
  keyPrinciple?: string;
  formulaSnippet?: string;
  visualType:
    | 'schematic'
    | 'mechanism'
    | 'interactive_diagram'
    | 'formula_focus'
    | 'comparison'
    | 'graph'
    | 'molecular_visual'
    | 'code_visual'
    | 'timeline'
    | 'anatomical_visual'
    | 'scientific_diagram'
    | 'interactive_simulation';
  visualData?: any;
  example?: {
    title: string;
    description: string;
  };
  checkQuestion?: {
    id?: string;
    prompt: string;
    options: { id: string; text: string; isCorrect: boolean; feedback: string }[];
  };
  hintText?: string;
  progressiveHint?: ProgressiveHint;
  /**
   * Lesson-owned "Try This" learner action shown beside the Smart Board.
   * Must be written for THIS concept — shared components never supply a default.
   */
  tryThis?: string;
  /** Lesson-owned common-mistake note shown after an incorrect answer. */
  commonMistake?: string;
  /**
   * Predict-first framing for a question step. Until the learner commits a
   * first answer, Buddy says `dialogue`, the board shows `boardSummary` (when
   * given) and the step's key principle stays hidden, so the check tests
   * reasoning instead of copying text that is already on screen. The full
   * explanation appears after the first attempt.
   */
  predict?: {
    dialogue: string;
    boardSummary?: string;
    /** Board title while predicting, when the real title would give the answer away. */
    boardTitle?: string;
  };
  /** Canonical class stage for this step (see lib/classroom/classStage.ts). */
  stage?: ClassStepStage;
}

/**
 * Canonical stage vocabulary for a lesson step. The student experiences one
 * continuous Class; the stage tells Buddy/Xira/Smart Board what the step is for.
 */
export type ClassStepStage =
  | 'introduce'
  | 'explain'
  | 'show'
  | 'interact'
  | 'question'
  | 'practice'
  | 'challenge'
  | 'assess'
  | 'reward';

/**
 * Lesson-owned Buddy script. Buddy never falls back to another concept's lines.
 */
export interface BuddyLessonScript {
  introduction: string;
  /** Optional opening used when the class is launched with intent=revision. */
  revisionIntroduction?: string;
  correct: string;
  incorrect: string;
  hint: string;
  transition: string;
  completion: string;
}

/** Lesson-owned Xira quick prompts (contextual, never global physics prompts). */
export interface XiraLessonPrompts {
  why: string;
  simpler: string;
  example: string;
  hint: string;
  deeper: string;
}

export interface FormulaItem {
  id: string;
  name: string;
  formula: string;
  variables: { symbol: string; description: string; unit?: string }[];
  description: string;
  example?: string;
}

export interface FlashcardItem {
  id: string;
  conceptId?: string;
  front: string;
  back: string;
  category?: string;
  difficulty?: QuestionDifficulty;
  tags?: string[];
  status?: 'UNSEEN' | 'KNOWN' | 'REVIEW';
}

export interface ClassroomSourceItem {
  id: string;
  title: string;
  authorOrPublisher: string;
  url?: string;
  type: 'curriculum' | 'textbook' | 'paper' | 'oer';
  note?: string;
}

export interface ClassroomLesson {
  id: string;
  conceptId: string;
  topicTitle: string;
  subject: string;
  gradeLevel?: string;
  estimatedMinutes: number;
  hasFormulas: boolean;
  learningObjective: string;
  steps: ClassroomLessonStep[];
  questions?: QuestionDefinition[];
  progressiveHints?: ProgressiveHint[];
  formulas?: FormulaItem[];
  flashcards?: FlashcardItem[];
  sources?: ClassroomSourceItem[];
  initialNotes?: string;
  /** Breadcrumb category shown after the subject (e.g. "Electromagnetism"). */
  category?: string;
  buddyScript?: BuddyLessonScript;
  xiraPrompts?: XiraLessonPrompts;
  /**
   * True when the lesson is an outline generated from curriculum metadata
   * rather than a fully authored interactive lesson. The UI must say so.
   */
  isOutline?: boolean;
  /** Lesson-level deterministic visual data shared by all steps (e.g. timeline milestones). */
  visualData?: Record<string, unknown>;
}

