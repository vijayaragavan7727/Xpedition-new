/**
 * Canonical concept identity types.
 *
 * A CanonicalConcept is the single authoritative description of a learnable
 * concept. Every Class subsystem (lesson, stage, Buddy, Xira, Smart Board
 * visual, session) must carry `concept.id` and compare it exactly.
 */

import type { ClassroomLesson, ClassStepStage } from '@/components/classroom/types';

/**
 * Deterministic Smart Board renderer family for a concept.
 * Resolved from the registry by exact concept id — never from display strings.
 */
export type ConceptVisualKind =
  | 'dc_motor_diagram'
  | 'projectile_simulation'
  | 'parabola_graph'
  | 'regression_graph'
  | 'derivative_graph'
  | 'molecular_geometry'
  | 'heart_anatomy'
  | 'history_timeline'
  | 'binary_search_trace'
  | 'polymorphism_dispatch'
  | 'periodic_table_interactive'
  | 'neural_network_teaching'
  /** Deterministic concept map built from the CURRENT lesson's own content. */
  | 'semantic_lesson';

export type LessonSource = 'authored' | 'curriculum_outline' | 'experience_only';

export interface CanonicalConcept {
  /** Exact canonical id, e.g. "periodic_table". */
  id: string;
  subject: string;
  title: string;
  description: string;
  learningObjective: string;
  /** Canonical ids of recommended prior concepts (all must exist in the registry). */
  prerequisites: string[];
  /** Empty string when the concept has no Class lesson (experience-only). */
  lessonId: string;
  lessonSource: LessonSource;
  hasClassLesson: boolean;
  visualKind: ConceptVisualKind;
  availableStages: ClassStepStage[];
  supportsRevision: boolean;
  /** Explicit alternative ids that resolve to this concept (exact match only). */
  aliases: string[];
  metadata: {
    category?: string;
    curriculumSubjectId?: string;
    level?: 'Beginner' | 'Intermediate' | 'Advanced';
    estimatedMinutes?: number;
  };
}

/**
 * Learner intent passed via `?intent=`. Intent may change pacing and emphasis;
 * it must NEVER change which concept is taught.
 */
export type ClassIntent = 'learn' | 'revision' | 'exam' | 'gk' | 'course' | 'project';

export const CLASS_INTENTS: readonly ClassIntent[] = ['learn', 'revision', 'exam', 'gk', 'course', 'project'];

export interface RevisionPlan {
  /** Key principle of each step, in order: the recap sequence. */
  recap: string[];
  /** Lesson question ids to use for retrieval practice. */
  retrievalQuestionIds: string[];
}

export type LessonUnavailableReason = 'empty_id' | 'invalid_id' | 'unknown_concept' | 'no_class_lesson';

export type LessonResolution =
  | {
      status: 'resolved';
      requestedConceptId: string;
      conceptId: string;
      matchedBy: 'exact' | 'alias';
      concept: CanonicalConcept;
      lesson: ClassroomLesson;
      intent: ClassIntent;
      revisionPlan: RevisionPlan | null;
    }
  | {
      status: 'unavailable';
      requestedConceptId: string;
      normalizedId: string;
      reason: LessonUnavailableReason;
      intent: ClassIntent;
    };
