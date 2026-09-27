/**
 * Smart Board visual identity contract.
 *
 * 1. The authoritative teaching visual is built deterministically from the
 *    ACTIVE concept + lesson + step (`buildStepVisualPayload`). It always
 *    carries conceptId, subject, visualType and the renderer family.
 * 2. Any other payload (session, OpenMAIC bridge, generated artwork) must pass
 *    `acceptVisualPayload` before it can influence the board. Missing identity
 *    is a rejection — it is never "re-labelled" with the active concept.
 * 3. Accepted external payloads may only contribute optional artwork
 *    (`assetUrl`). They never replace the deterministic renderer.
 */

import type { ClassroomLesson, ClassroomLessonStep } from '@/components/classroom/types';
import type { SmartBoardVisualPayload, RepresentationType } from '@/lib/visualIntelligence/types';
import type { CanonicalConcept, ConceptVisualKind } from '@/lib/concepts/types';
import { resolveStepStage } from './classStage';

export interface VisualIdentityMetadata {
  conceptId: string;
  subject: string;
  conceptVisual: ConceptVisualKind;
  lessonId: string;
  stepId: string;
  stepIndex: number;
  stage: string;
}

export interface SemanticLessonContext {
  title: string;
  subject: string;
  activeIndex: number;
  steps: Array<{ title: string; boardTitle: string; keyPrinciple?: string }>;
}

const STEP_TO_REPRESENTATION: Record<string, RepresentationType> = {
  graph: 'graph',
  timeline: 'timeline',
  code_visual: 'code_visual',
  molecular_visual: 'molecular_visual',
  anatomical_visual: 'anatomical_visual',
  interactive_simulation: 'interactive_simulation',
  comparison: 'comparison_visual',
  formula_focus: 'formula_visual',
};

export function buildStepVisualPayload(
  concept: CanonicalConcept,
  lesson: ClassroomLesson,
  step: ClassroomLessonStep,
  stepIndex: number
): SmartBoardVisualPayload {
  const stage = resolveStepStage(step, stepIndex, lesson.steps.length);
  const lessonContext: SemanticLessonContext = {
    title: lesson.topicTitle,
    subject: lesson.subject,
    activeIndex: stepIndex,
    steps: lesson.steps.map((s) => ({ title: s.title, boardTitle: s.boardTitle, keyPrinciple: s.keyPrinciple })),
  };
  const metadata: VisualIdentityMetadata = {
    conceptId: concept.id,
    subject: concept.subject,
    conceptVisual: concept.visualKind,
    lessonId: lesson.id,
    stepId: step.id,
    stepIndex,
    stage,
  };
  return {
    type: 'visual_requirement',
    visualType: STEP_TO_REPRESENTATION[step.visualType] ?? 'scientific_diagram',
    title: step.boardTitle,
    purpose: step.boardSummary,
    visualData: {
      ...(lesson.visualData ?? {}),
      ...(step.visualData ?? {}),
      lessonContext,
    },
    metadata: metadata as unknown as Record<string, unknown>,
  };
}

export type VisualRejectReason =
  | 'missing_payload'
  | 'missing_concept_id'
  | 'missing_subject'
  | 'missing_visual_type'
  | 'concept_mismatch'
  | 'step_mismatch';

export interface VisualAcceptResult {
  accepted: boolean;
  reason?: VisualRejectReason;
}

/**
 * Identity gate for any visual payload that did not originate from
 * `buildStepVisualPayload` for the active step.
 */
export function acceptVisualPayload(
  active: { conceptId: string; stepIndex?: number },
  payload: SmartBoardVisualPayload | null | undefined
): VisualAcceptResult {
  if (!payload) return { accepted: false, reason: 'missing_payload' };
  const meta = (payload.metadata ?? {}) as Record<string, unknown>;
  const conceptId = typeof meta.conceptId === 'string' ? meta.conceptId : '';
  if (!conceptId) return { accepted: false, reason: 'missing_concept_id' };
  if (typeof meta.subject !== 'string' || !meta.subject) return { accepted: false, reason: 'missing_subject' };
  if (!payload.visualType) return { accepted: false, reason: 'missing_visual_type' };
  if (conceptId !== active.conceptId) return { accepted: false, reason: 'concept_mismatch' };
  if (
    typeof active.stepIndex === 'number' &&
    typeof meta.stepIndex === 'number' &&
    meta.stepIndex !== active.stepIndex
  ) {
    return { accepted: false, reason: 'step_mismatch' };
  }
  return { accepted: true };
}
