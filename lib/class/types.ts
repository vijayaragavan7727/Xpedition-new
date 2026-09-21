/**
 * XPEDITION UNIFIED CLASS SYSTEM TYPES
 * Specification: Step 1 UX Specification (xpedition_ux_redesign_spec.md)
 * Foundation: Step 2 Design System (Design 1 — Dark, Immersive, 3D Focus)
 */

import { BuddyMood } from '@/components/ui/BuddySpeech';

export type ClassStageId =
  | 'introduce'
  | 'explain'
  | 'explore'
  | 'predict'
  | 'interact'
  | 'observe'
  | 'quick_check'
  | 'mission'
  | 'challenge'
  | 'assessment'
  | 'feedback'
  | 'reward'
  | 'next_class';

export interface ClassStageMetadata {
  id: ClassStageId;
  label: string;
  stepNumber: number;
  totalSteps: number;
  primaryCta: string;
  skipLabel?: string;
  canSkip: boolean;
}

export interface ClassSessionData {
  conceptId: string;
  conceptName: string;
  subject: string;
  classNumber: number;
  totalClasses: number;
  estimatedMinutes: number;
  xpReward: number;
  difficulty: 'Foundation' | 'Intermediate' | 'Advanced';
  modality: 'FULL_3D' | 'MOTION_VISUAL' | 'INTERACTIVE_VISUAL' | 'CODE_LAB' | '2D_FALLBACK';
  
  // Real Pedagogical Content
  hook: string;
  objective: string;
  explanation: {
    title: string;
    summary: string;
    keyPrinciple: string;
    formula?: string;
  };
  prediction: {
    question: string;
    options: {
      id: string;
      label: string;
      description: string;
      isCorrect: boolean;
    }[];
    explanation: string;
  };
  quickCheck: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
  mission: {
    title: string;
    description: string;
    target: string;
    maxAttempts: number;
    xpBonus: number;
  };
  challenge: {
    title: string;
    description: string;
    constraint: string;
    xpBonus: number;
  };
  assessment: {
    questions: {
      id: string;
      prompt: string;
      options: string[];
      correctIndex: number;
      explanation: string;
    }[];
  };
  nextConcept: {
    conceptId: string;
    conceptName: string;
    subject: string;
    reason: string;
  };
}
