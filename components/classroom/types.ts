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
}

