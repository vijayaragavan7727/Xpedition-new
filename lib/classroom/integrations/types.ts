import type { ClassroomLessonStep, ClassroomLesson } from '@/components/classroom/types';

export type ClassroomIntegrationId = 'openmaic' | 'livegenie' | 'canvas' | 'miro';
export type ClassroomIntegrationStatus = 'available' | 'configured' | 'disabled' | 'unavailable';

export type ClassroomStage =
  | 'INTRO'
  | 'EXPLAIN'
  | 'VISUALIZE'
  | 'INTERACT'
  | 'QUESTION'
  | 'FEEDBACK'
  | 'PRACTICE'
  | 'CHALLENGE'
  | 'REWARD'
  | 'NEXT';

export interface ClassroomIntegrationContext {
  conceptId: string;
  topicTitle: string;
  subject: string;
  stage: ClassroomStage;
  stepIndex: number;
  lesson: ClassroomLesson;
  step: ClassroomLessonStep;
}

export interface ClassroomSceneRequest extends ClassroomIntegrationContext {
  purpose: 'teach' | 'visualize' | 'interact' | 'practice' | 'challenge';
}

export interface ClassroomScene {
  provider: ClassroomIntegrationId;
  kind: 'scene' | 'activity' | 'workspace' | 'conversation';
  title: string;
  description?: string;
  payload?: Record<string, unknown>;
  externalUrl?: string;
}

export interface ClassroomAction {
  type: string;
  payload?: Record<string, unknown>;
}

export interface ClassroomActionResult {
  ok: boolean;
  provider: ClassroomIntegrationId;
  message?: string;
  payload?: Record<string, unknown>;
}

export interface ClassroomProviderStatus {
  id: ClassroomIntegrationId;
  label: string;
  status: ClassroomIntegrationStatus;
  reason?: string;
  capabilities: string[];
}
