/**
 * The ONE authoritative Class lesson resolver.
 *
 * Both `/class?concept=X` and `/class/X` call `resolveClassLesson()`. So do the
 * classroom session API and the Xira classroom orchestrator.
 *
 *   requested id ──normalise──▶ exact registry lookup ──▶ CanonicalConcept
 *                                                     └──▶ lesson (authored | outline)
 *
 * Guarantees:
 *   - resolution.conceptId === concept.id === lesson.conceptId (asserted).
 *   - Unknown ids produce `status: 'unavailable'` — never another lesson.
 *   - `intent` is parsed and carried alongside; it never changes identity.
 */

import { getLessonForCanonicalId, lookupConcept, normalizeConceptId } from './conceptRegistry';
import { CLASS_INTENTS, type ClassIntent, type LessonResolution, type RevisionPlan } from './types';
import type { ClassroomLesson } from '@/components/classroom/types';

/** Parses `?intent=`. Unknown or missing values become 'learn'. */
export function parseClassIntent(raw: unknown): ClassIntent {
  if (typeof raw !== 'string') return 'learn';
  const value = raw.trim().toLowerCase();
  return (CLASS_INTENTS as readonly string[]).includes(value) ? (value as ClassIntent) : 'learn';
}

function buildRevisionPlan(lesson: ClassroomLesson): RevisionPlan {
  return {
    recap: lesson.steps.map((s) => s.keyPrinciple || s.boardSummary).filter(Boolean),
    retrievalQuestionIds: (lesson.questions ?? []).map((q) => q.id),
  };
}

export function resolveClassLesson(rawConceptId: unknown, rawIntent?: unknown): LessonResolution {
  const requestedConceptId = typeof rawConceptId === 'string' ? rawConceptId : '';
  const intent = parseClassIntent(rawIntent);
  const normalizedId = normalizeConceptId(rawConceptId);
  const canonicalNeuralId =
    normalizedId === 'neural_network_basics' || normalizedId.startsWith('neural_network_')
      ? 'neural_network_basics'
      : normalizedId;

  // The current product slice is intentionally focused on the Neural Networks
  // flagship. Legacy curriculum ids must not surface as Class lessons.
  if (normalizedId && canonicalNeuralId !== 'neural_network_basics') {
    return { status: 'unavailable', requestedConceptId, normalizedId: canonicalNeuralId, reason: 'unknown_concept', intent };
  }

  if (!requestedConceptId.trim()) {
    return { status: 'unavailable', requestedConceptId, normalizedId: '', reason: 'empty_id', intent };
  }
  if (!normalizedId) {
    return { status: 'unavailable', requestedConceptId, normalizedId: '', reason: 'invalid_id', intent };
  }

  const match = lookupConcept(canonicalNeuralId);
  if (match && !match.concept.hasClassLesson) {
    return { status: 'unavailable', requestedConceptId, normalizedId: canonicalNeuralId, reason: 'no_class_lesson', intent };
  }
  const lesson = match ? getLessonForCanonicalId(match.concept.id) : null;
  if (!match || !lesson) {
    return { status: 'unavailable', requestedConceptId, normalizedId, reason: 'unknown_concept', intent };
  }

  // Identity invariant: the three ids must be identical, or we refuse.
  if (lesson.conceptId !== match.concept.id) {
    return { status: 'unavailable', requestedConceptId, normalizedId, reason: 'unknown_concept', intent };
  }

  return {
    status: 'resolved',
    requestedConceptId,
    conceptId: match.concept.id,
    matchedBy: match.matchedBy,
    concept: match.concept,
    lesson,
    intent,
    revisionPlan: intent === 'revision' ? buildRevisionPlan(lesson) : null,
  };
}

/** Canonical URL for a concept's Class. Both routes converge on this form. */
export function classUrlFor(conceptId: string, intent?: ClassIntent): string {
  const params = new URLSearchParams({ concept: conceptId });
  if (intent && intent !== 'learn') params.set('intent', intent);
  return `/class?${params.toString()}`;
}
