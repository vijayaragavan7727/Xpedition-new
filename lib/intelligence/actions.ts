/**
 * Xpedition Decision Engine v1 — Learning Action Taxonomy
 *
 * Defines the controlled taxonomy of pedagogical actions that Xpedition recommends
 * based on learner state, accuracy patterns, confidence, and retention risk.
 */

import { Capability, ProviderId } from './types';

export type LearningAction =
  | 'LEARN_CONCEPT'
  | 'PRACTICE_CONCEPT'
  | 'CORRECT_MISCONCEPTION'
  | 'REVIEW_CONCEPT'
  | 'SPACED_REVIEW'
  | 'HARDER_CHALLENGE'
  | 'EXAM_MOCK'
  | 'WRITING_EXERCISE'
  | 'RESEARCH_TOPIC'
  | 'MATH_VERIFICATION'
  | 'DOCUMENT_GROUNDED_QA'
  | 'TUTOR_EXPLANATION'
  | 'FLASHCARD_REVIEW'
  | 'CONFIDENCE_REINFORCEMENT';

export type ActionPriority = 'low' | 'medium' | 'high' | 'critical';

export interface ActionDefinition {
  action: LearningAction;
  name: string;
  description: string;
  defaultCapability: Capability;
  defaultEstimatedMinutes: number;
  defaultPriority: ActionPriority;
}

export const ACTION_CATALOG: Record<LearningAction, ActionDefinition> = {
  LEARN_CONCEPT: {
    action: 'LEARN_CONCEPT',
    name: 'Learn New Concept',
    description: 'Foundational introduction with real-world framing and analogies for an unstarted concept.',
    defaultCapability: 'tutor',
    defaultEstimatedMinutes: 8,
    defaultPriority: 'high',
  },
  PRACTICE_CONCEPT: {
    action: 'PRACTICE_CONCEPT',
    name: 'Practice Active Concept',
    description: 'Targeted quest items to build mastery and solidify concept mechanics.',
    defaultCapability: 'generateQuestion',
    defaultEstimatedMinutes: 10,
    defaultPriority: 'medium',
  },
  CORRECT_MISCONCEPTION: {
    action: 'CORRECT_MISCONCEPTION',
    name: 'Address Misconception',
    description: 'Diagnoses underlying false assumptions triggered by repeated or high-confidence mistakes.',
    defaultCapability: 'misconceptionCorrection',
    defaultEstimatedMinutes: 6,
    defaultPriority: 'critical',
  },
  REVIEW_CONCEPT: {
    action: 'REVIEW_CONCEPT',
    name: 'Concept Refresher',
    description: 'Concise review of key formulas, principles, and common pitfalls.',
    defaultCapability: 'explain',
    defaultEstimatedMinutes: 5,
    defaultPriority: 'medium',
  },
  SPACED_REVIEW: {
    action: 'SPACED_REVIEW',
    name: 'Spaced Repetition Review',
    description: 'Active recall for previously mastered concepts showing retention fading risk.',
    defaultCapability: 'summarize',
    defaultEstimatedMinutes: 5,
    defaultPriority: 'high',
  },
  HARDER_CHALLENGE: {
    action: 'HARDER_CHALLENGE',
    name: 'Advanced Challenge',
    description: 'Complex synthesis and edge-case scenarios for concepts with high mastery.',
    defaultCapability: 'challenge',
    defaultEstimatedMinutes: 12,
    defaultPriority: 'medium',
  },
  EXAM_MOCK: {
    action: 'EXAM_MOCK',
    name: 'Exam Mock Simulation',
    description: 'Timed multi-topic assessment tailored to upcoming exam deadlines.',
    defaultCapability: 'generateMCQ',
    defaultEstimatedMinutes: 20,
    defaultPriority: 'high',
  },
  WRITING_EXERCISE: {
    action: 'WRITING_EXERCISE',
    name: 'Descriptive Writing Exercise',
    description: 'Structured essay or long-form answer with qualitative evaluation.',
    defaultCapability: 'evaluateWriting',
    defaultEstimatedMinutes: 15,
    defaultPriority: 'medium',
  },
  RESEARCH_TOPIC: {
    action: 'RESEARCH_TOPIC',
    name: 'Current Affairs & Research',
    description: 'Real-time source-backed investigation for contemporary topics and policy updates.',
    defaultCapability: 'research',
    defaultEstimatedMinutes: 7,
    defaultPriority: 'medium',
  },
  MATH_VERIFICATION: {
    action: 'MATH_VERIFICATION',
    name: 'Math & Proof Verification',
    description: 'Step-by-step rigorous calculation and mathematical verification.',
    defaultCapability: 'mathSolve',
    defaultEstimatedMinutes: 8,
    defaultPriority: 'medium',
  },
  DOCUMENT_GROUNDED_QA: {
    action: 'DOCUMENT_GROUNDED_QA',
    name: 'Document-Grounded Study',
    description: 'In-depth learning against uploaded syllabus, notes, or textbook chapter.',
    defaultCapability: 'documentQA',
    defaultEstimatedMinutes: 10,
    defaultPriority: 'medium',
  },
  TUTOR_EXPLANATION: {
    action: 'TUTOR_EXPLANATION',
    name: 'Tutor Guidance',
    description: 'Conversational mentoring and guidance from your adaptive learning companion.',
    defaultCapability: 'tutor',
    defaultEstimatedMinutes: 5,
    defaultPriority: 'medium',
  },
  FLASHCARD_REVIEW: {
    action: 'FLASHCARD_REVIEW',
    name: 'Flashcard Rapid Recall',
    description: 'Fast-paced active recall for definitions, dates, and terminology.',
    defaultCapability: 'generateFlashcards',
    defaultEstimatedMinutes: 4,
    defaultPriority: 'low',
  },
  CONFIDENCE_REINFORCEMENT: {
    action: 'CONFIDENCE_REINFORCEMENT',
    name: 'Confidence Reinforcement',
    description: 'Affirms correct intuition when a learner was unsure but answered correctly.',
    defaultCapability: 'explain',
    defaultEstimatedMinutes: 4,
    defaultPriority: 'medium',
  },
};

export interface NextBestAction {
  action: LearningAction;
  targetConceptId?: string;
  targetConceptName?: string;
  reason: string;
  estimatedMinutes: number;
  priority: ActionPriority;
  capability: Capability;
  providerDecision: {
    provider: ProviderId;
    fallbackUsed: boolean;
  };
}

/**
 * Resolves the safest existing application route for a recommended NextBestAction.
 * Connects directly to existing learning, quest, review, and tutor flows.
 */
export function getActionRoute(
  nextAction?: Partial<NextBestAction> | null,
  defaultFallback: string = '/quest'
): string {
  if (!nextAction || !nextAction.action) return defaultFallback;

  const conceptId = nextAction.targetConceptId;
  const encodedConcept = conceptId ? encodeURIComponent(conceptId) : '';

  switch (nextAction.action) {
    case 'LEARN_CONCEPT':
      return conceptId && conceptId !== 'default' ? `/tutor/${encodedConcept}` : '/learn';

    case 'PRACTICE_CONCEPT':
      return conceptId && conceptId !== 'default' ? `/quest?concept=${encodedConcept}` : '/quest';

    case 'CORRECT_MISCONCEPTION':
      return conceptId && conceptId !== 'default' ? `/quest?concept=${encodedConcept}&mode=assisted` : '/quest';

    case 'CONFIDENCE_REINFORCEMENT':
      return conceptId && conceptId !== 'default' ? `/quest?concept=${encodedConcept}` : '/quest';

    case 'REVIEW_CONCEPT':
    case 'SPACED_REVIEW':
      return conceptId && conceptId !== 'default' ? `/quest?concept=${encodedConcept}&mode=review` : '/quest';

    case 'HARDER_CHALLENGE':
      return conceptId && conceptId !== 'default' ? `/quest?concept=${encodedConcept}&mode=challenge` : '/quest';

    case 'EXAM_MOCK':
      return '/quest?mode=mock';

    case 'RESEARCH_TOPIC':
      return '/xira';

    case 'WRITING_EXERCISE':
    case 'MATH_VERIFICATION':
    case 'DOCUMENT_GROUNDED_QA':
    case 'TUTOR_EXPLANATION':
    case 'FLASHCARD_REVIEW':
      return conceptId && conceptId !== 'default' ? `/tutor/${encodedConcept}` : '/quest';

    default:
      return conceptId && conceptId !== 'default' ? `/quest?concept=${encodedConcept}` : defaultFallback;
  }
}

/**
 * Formats a clear, active title for a NextBestAction.
 */
export function formatActionTitle(
  nextAction?: Partial<NextBestAction> | null,
  fallbackConcept: string = 'Active Topic'
): string {
  if (!nextAction || !nextAction.action) return `Continue ${fallbackConcept}`;

  const conceptName = nextAction.targetConceptName || fallbackConcept;

  switch (nextAction.action) {
    case 'LEARN_CONCEPT':
      return `Learn ${conceptName}`;
    case 'PRACTICE_CONCEPT':
      return `Practice ${conceptName}`;
    case 'CORRECT_MISCONCEPTION':
      return `Fix your understanding of ${conceptName}`;
    case 'CONFIDENCE_REINFORCEMENT':
      return `Reinforce ${conceptName}`;
    case 'SPACED_REVIEW':
    case 'REVIEW_CONCEPT':
      return `Review ${conceptName}`;
    case 'HARDER_CHALLENGE':
      return `Challenge: ${conceptName}`;
    case 'EXAM_MOCK':
      return `Mock Exam Drill`;
    case 'RESEARCH_TOPIC':
      return `Explore ${conceptName}`;
    case 'MATH_VERIFICATION':
      return `Verify & Solve ${conceptName}`;
    case 'WRITING_EXERCISE':
      return `Writing Practice: ${conceptName}`;
    case 'FLASHCARD_REVIEW':
      return `Flashcard Drill: ${conceptName}`;
    case 'TUTOR_EXPLANATION':
      return `Tutor Session: ${conceptName}`;
    default:
      return `Continue ${conceptName}`;
  }
}

/**
 * Maps priority to design system badge variant.
 */
export function getActionBadgeVariant(priority?: ActionPriority): 'default' | 'cyan' | 'indigo' | 'warning' | 'error' {
  switch (priority) {
    case 'critical':
      return 'error';
    case 'high':
      return 'warning';
    case 'medium':
      return 'cyan';
    case 'low':
    default:
      return 'indigo';
  }
}

/**
 * Formats a concise call-to-action button label.
 */
export function getActionCtaLabel(nextAction?: Partial<NextBestAction> | null): string {
  if (!nextAction || !nextAction.action) return 'Start';

  switch (nextAction.action) {
    case 'LEARN_CONCEPT':
      return 'Start Lesson';
    case 'CORRECT_MISCONCEPTION':
      return 'Fix Misconception';
    case 'SPACED_REVIEW':
    case 'REVIEW_CONCEPT':
      return 'Start Review';
    case 'HARDER_CHALLENGE':
      return 'Take Challenge';
    case 'EXAM_MOCK':
      return 'Start Mock';
    case 'RESEARCH_TOPIC':
      return 'Open XIRA';
    case 'PRACTICE_CONCEPT':
    default:
      return 'Start Practice';
  }
}

