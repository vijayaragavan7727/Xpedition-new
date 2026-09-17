/**
 * Xpedition Intelligence Layer v1 — Capabilities Catalog
 *
 * Defines the taxonomy of educational & reasoning capabilities with their descriptions.
 */

import { Capability } from './types';

export interface CapabilityDefinition {
  id: Capability;
  name: string;
  description: string;
  typicalOutput: 'text' | 'json' | 'structured_list' | 'search_results';
  defaultTemperature: number;
}

export const CAPABILITY_CATALOG: Record<Capability, CapabilityDefinition> = {
  tutor: {
    id: 'tutor',
    name: 'Adaptive Tutor',
    description: 'Conversational technical and academic guidance tailored to learner pace and level.',
    typicalOutput: 'text',
    defaultTemperature: 0.5,
  },
  explain: {
    id: 'explain',
    name: 'Concept Explanation',
    description: 'Clear, multi-step explanation with real-world analogies and scaffolding.',
    typicalOutput: 'text',
    defaultTemperature: 0.4,
  },
  hint: {
    id: 'hint',
    name: 'Socratic Hint',
    description: 'Scaffolded hint without giving away the direct answer.',
    typicalOutput: 'text',
    defaultTemperature: 0.3,
  },
  generateQuestion: {
    id: 'generateQuestion',
    name: 'Question Generation',
    description: 'Generates targeted practice items and conceptual challenges.',
    typicalOutput: 'json',
    defaultTemperature: 0.4,
  },
  generateMCQ: {
    id: 'generateMCQ',
    name: 'MCQ Generation',
    description: 'Structured 4-option questions with distractors and pedagogical explanations.',
    typicalOutput: 'json',
    defaultTemperature: 0.4,
  },
  generateFlashcards: {
    id: 'generateFlashcards',
    name: 'Flashcard Generation',
    description: 'Concise front/back active recall flashcards.',
    typicalOutput: 'json',
    defaultTemperature: 0.3,
  },
  evaluateAnswer: {
    id: 'evaluateAnswer',
    name: 'Answer Evaluation',
    description: 'Diagnoses student answers, identifies logic gaps, and gives constructive feedback.',
    typicalOutput: 'json',
    defaultTemperature: 0.2,
  },
  evaluateWriting: {
    id: 'evaluateWriting',
    name: 'Descriptive Writing Evaluation',
    description: 'Deep qualitative analysis of essays, long-form answers, and case analyses.',
    typicalOutput: 'json',
    defaultTemperature: 0.2,
  },
  misconceptionCorrection: {
    id: 'misconceptionCorrection',
    name: 'Misconception Correction',
    description: 'Pinpoints underlying false assumptions and reframes core concepts.',
    typicalOutput: 'text',
    defaultTemperature: 0.3,
  },
  challenge: {
    id: 'challenge',
    name: 'High-Mastery Challenge',
    description: 'Advanced edge-case scenarios and multi-concept synthesis for top performers.',
    typicalOutput: 'json',
    defaultTemperature: 0.5,
  },
  complexReasoning: {
    id: 'complexReasoning',
    name: 'Complex Multi-Step Reasoning',
    description: 'Deep algorithmic derivation, architecture trade-offs, and multi-discipline synthesis.',
    typicalOutput: 'text',
    defaultTemperature: 0.3,
  },
  longContext: {
    id: 'longContext',
    name: 'Long-Context Analysis',
    description: 'Comprehensive analysis over full textbook chapters, large syllabi, and multi-page documents.',
    typicalOutput: 'json',
    defaultTemperature: 0.2,
  },
  summarize: {
    id: 'summarize',
    name: 'Pedagogical Summary',
    description: 'Distills key takeaways, formulas, and milestones.',
    typicalOutput: 'text',
    defaultTemperature: 0.3,
  },
  translate: {
    id: 'translate',
    name: 'Language & Tanglish Translation',
    description: 'Accurate translation maintaining technical terminology in English.',
    typicalOutput: 'text',
    defaultTemperature: 0.2,
  },
  mathSolve: {
    id: 'mathSolve',
    name: 'Mathematical & Logic Verification',
    description: 'Step-by-step rigorous derivation and calculation checking.',
    typicalOutput: 'json',
    defaultTemperature: 0.1,
  },
  multimodal: {
    id: 'multimodal',
    name: 'Multimodal Vision & Diagram Analysis',
    description: 'Interprets diagrams, formulas, sketches, and charts from images.',
    typicalOutput: 'text',
    defaultTemperature: 0.2,
  },
  research: {
    id: 'research',
    name: 'Current Affairs & Web Grounding',
    description: 'Real-time factual verification and source-backed topic exploration.',
    typicalOutput: 'search_results',
    defaultTemperature: 0.2,
  },
  documentQA: {
    id: 'documentQA',
    name: 'Document & Syllabus QA',
    description: 'Extracts structured modules and answers questions against uploaded documents.',
    typicalOutput: 'json',
    defaultTemperature: 0.2,
  },
};

export function getCapabilityDefinition(capability: Capability): CapabilityDefinition {
  return CAPABILITY_CATALOG[capability] || {
    id: capability,
    name: capability,
    description: 'Custom capability execution',
    typicalOutput: 'text',
    defaultTemperature: 0.4,
  };
}
