/**
 * Xpedition Universal Teaching Engine v1 — Topic & Teaching Experience Types
 *
 * Core declarative contracts for converting any learning topic into an appropriate,
 * interactive, observable educational experience.
 */

import { ExperienceType, UniversalExperienceFamily, ChallengeConfig, PredictionChallengeConfig } from './types';
import { UniversalSceneDefinition, SceneInteractionConfig } from './scene/sceneDefinition';
import type { EducationalSource, LearningKnowledgeBundle } from '../intelligence/sources';
import type { TeachingMode, VisualTeachingPlan } from './visualTeaching/types';

export type { TeachingMode, VisualTeachingPlan };

export type SubjectCategory =
  | 'Physics'
  | 'Chemistry'
  | 'Biology'
  | 'Mathematics'
  | 'Computer Science'
  | 'Astronomy'
  | 'Economics'
  | 'History'
  | 'Language & Grammar'
  | 'Data Science'
  | 'General Science'
  | 'Interdisciplinary';

export type { UniversalExperienceFamily };

export type VisualRepresentationMode =
  | '3d_scene'
  | 'interactive_simulation'
  | 'interactive_diagram'
  | 'manipulable_model'
  | 'structured_visual';

export type FallbackExperienceType =
  | 'interactive_diagram'
  | 'structured_visual'
  | 'scenario'
  | 'practice_challenge';

export type SourceGroundingType =
  | 'source_backed'
  | 'canonical_skill_graph'
  | 'specialized_experience'
  | 'curated_topic_registry'
  | 'ai_synthesized'
  | 'deterministic_fallback';

export interface UniversalLearningTopic {
  topicId: string;
  rawUserTopic: string;
  normalizedTopic: string;
  subject: SubjectCategory;
  domain: string;
  conceptIds: string[];
  prerequisites: string[];
  learningObjectives: string[];
  difficulty: number; // 0.0 to 1.0
  learnerLevel: 'beginner' | 'intermediate' | 'advanced';
  goal: string;
  recommendedExperienceType: UniversalExperienceFamily | ExperienceType;
  visualRepresentation: VisualRepresentationMode;
  teachingMode?: TeachingMode;
  availableExperience: boolean;
  fallbackExperience: FallbackExperienceType;
  sourceGrounding: SourceGroundingType;
  confidence: number; // 0.0 to 1.0
  keyPrinciples: string[];
  interactiveVariables?: Array<{
    name: string;
    label: string;
    unit?: string;
    min: number;
    max: number;
    defaultValue: number;
    step?: number;
    description?: string;
  }>;
  sources?: EducationalSource[];
  knowledgeBundle?: LearningKnowledgeBundle;
  generatedContentMetadata?: Record<string, any>;
}

export type TeachingStepType =
  | 'INTRODUCE'
  | 'EXPLORE'
  | 'PREDICT'
  | 'EXPERIMENT'
  | 'OBSERVE'
  | 'EXPLAIN'
  | 'CHALLENGE'
  | 'ASSESS'
  | 'COMPLETE';

export interface TeachingStep {
  stepId: string;
  type: TeachingStepType;
  title: string;
  instruction: string;
  educationalPrinciple: string;
  hint?: string;
  cameraWaypoint?: string;
  highlightObjectIds?: string[];
  requiredInteraction?: string;
}

export interface FallbackTeachingPlan {
  type: FallbackExperienceType;
  title: string;
  summary: string;
  diagramElements?: Array<{
    id: string;
    label: string;
    type: 'node' | 'arrow' | 'group' | 'metric';
    description: string;
  }>;
  principles: string[];
  interactiveCheck: {
    question: string;
    options: Array<{ id: string; text: string; isCorrect: boolean; explanation: string }>;
  };
}

export interface TeachingExperiencePlan {
  planId: string;
  topic: UniversalLearningTopic;
  objective: string;
  experienceFamily: UniversalExperienceFamily;
  experienceType: ExperienceType | string;
  experienceId: string;
  isSpecializedExperience: boolean;
  sceneDefinition?: UniversalSceneDefinition;
  visualTeachingPlan?: VisualTeachingPlan;
  teachingSteps: TeachingStep[];
  interactions: SceneInteractionConfig[];
  challenge: ChallengeConfig;
  predictionChallenge?: PredictionChallengeConfig;
  assessmentCriteria: {
    targetMetric?: string;
    successCondition: string;
    misconceptionChecks: Array<{
      triggerCondition: string;
      diagnosis: string;
      remediation: string;
    }>;
  };
  sources?: EducationalSource[];
  knowledgeBundle?: LearningKnowledgeBundle;
  fallbackPlan: FallbackTeachingPlan;
}

export interface UniversalTeachingSessionState {
  sessionId: string;
  plan: TeachingExperiencePlan;
  currentStepIndex: number;
  currentStep: TeachingStep;
  interactionCount: number;
  parameterValues: Record<string, number | string | boolean>;
  selectedObjectId?: string;
  predictionSubmitted?: {
    optionId: string;
    isCorrect: boolean;
    explanation: string;
  };
  observedOutcomes: Array<{
    timestamp: number;
    parameterSnapshot: Record<string, any>;
    metricResult: number | string;
    principleVerified?: string;
  }>;
  xiraObservations: Array<{
    timestamp: number;
    text: string;
    type: 'observation' | 'hint' | 'praise' | 'misconception';
  }>;
  challengeSubmitted?: {
    isCorrect: boolean;
    score: number;
    feedback: string;
  };
  isCompleted: boolean;
  score: number;
  timeSpentSeconds: number;
}
