/**
 * Passport evidence model — honest, traceable, internal.
 *
 *   concept → attempts → interactions → assessment → mastery evidence
 *
 * Every number is derived from the learner's own recorded activity. Nothing is
 * signed or externally verified, and the record says so (`externallyVerified: false`).
 * Concept identity comes from the canonical registry when the id is canonical;
 * otherwise from the learner's own goal graph. Unknown ids are kept as-is and
 * never mapped to another concept.
 */

import type { Attempt, UserStoreData } from '../store';
import { getCanonicalConcept } from '../concepts/conceptRegistry';

/** Concepts whose attempts come from hands-on labs/simulations (interactive evidence). */
export const HANDS_ON_CONCEPTS: Record<string, string> = {
  python_debugging_basics: 'Live code debugging lab',
  human_heart_anatomy: '3D heart anatomy explorer',
  spatial_reasoning: '3D spatial alignment lab',
  projectile_motion: 'Projectile motion simulation',
  molecular_bonding: 'Molecule builder',
};

export type EvidenceLevel = 'none' | 'practised' | 'assessed' | 'mastered';

export interface ConceptEvidence {
  conceptId: string;
  title: string;
  identitySource: 'canonical_registry' | 'learner_goal_graph' | 'attempt_record';
  attempts: { total: number; correct: number };
  interactions: { handsOnAttempts: number; activity: string | null };
  assessment: { soloAttempts: number; soloCorrect: number; soloAccuracy: number | null };
  mastery: { percent: number; level: EvidenceLevel };
  lastEvidenceAt: number | null;
}

export interface PassportEvidenceRecord {
  kind: 'internal_learning_record';
  externallyVerified: false;
  signed: false;
  generatedAt: number;
  learnerHandle: string;
  concepts: ConceptEvidence[];
}

/** Transparent thresholds (documented in the Passport UI). */
export const MASTERY_THRESHOLDS = { masteredPercent: 80, masteredMinSoloAttempts: 3 } as const;

function levelFor(total: number, soloAttempts: number, masteryPercent: number): EvidenceLevel {
  if (total === 0) return 'none';
  if (masteryPercent >= MASTERY_THRESHOLDS.masteredPercent && soloAttempts >= MASTERY_THRESHOLDS.masteredMinSoloAttempts) {
    return 'mastered';
  }
  if (soloAttempts > 0) return 'assessed';
  return 'practised';
}

export function buildPassportEvidence(store: UserStoreData, now: number = Date.now()): PassportEvidenceRecord {
  const attempts: Attempt[] = (store.attempts || []).filter((a) => !a.isVoid && typeof a.conceptId === 'string' && a.conceptId);
  const byConcept = new Map<string, Attempt[]>();
  for (const a of attempts) {
    const list = byConcept.get(a.conceptId) ?? [];
    list.push(a);
    byConcept.set(a.conceptId, list);
  }
  // Concepts tracked in the goal graph are included even with zero attempts.
  for (const c of store.concepts || []) {
    if (!byConcept.has(c.id)) byConcept.set(c.id, []);
  }

  const concepts: ConceptEvidence[] = [];
  for (const [conceptId, list] of byConcept) {
    const canonical = getCanonicalConcept(conceptId);
    const graphConcept = (store.concepts || []).find((c) => c.id === conceptId);
    const title = canonical?.title ?? graphConcept?.name ?? list[0]?.conceptName ?? conceptId;
    const identitySource: ConceptEvidence['identitySource'] = canonical
      ? 'canonical_registry'
      : graphConcept
      ? 'learner_goal_graph'
      : 'attempt_record';

    const correct = list.filter((a) => a.isCorrect).length;
    const solo = list.filter((a) => a.isSolo);
    const soloCorrect = solo.filter((a) => a.isCorrect).length;
    const handsOn = HANDS_ON_CONCEPTS[conceptId] ? list.length : 0;
    const masteryPercent = Math.max(0, Math.min(100, Math.round(graphConcept?.masteryPercentage ?? 0)));

    concepts.push({
      conceptId,
      title,
      identitySource,
      attempts: { total: list.length, correct },
      interactions: { handsOnAttempts: handsOn, activity: HANDS_ON_CONCEPTS[conceptId] ?? null },
      assessment: {
        soloAttempts: solo.length,
        soloCorrect,
        soloAccuracy: solo.length > 0 ? Math.round((soloCorrect / solo.length) * 100) : null,
      },
      mastery: { percent: masteryPercent, level: levelFor(list.length, solo.length, masteryPercent) },
      lastEvidenceAt: list.length > 0 ? Math.max(...list.map((a) => a.timestamp || 0)) : null,
    });
  }

  concepts.sort((a, b) => (b.lastEvidenceAt ?? 0) - (a.lastEvidenceAt ?? 0));
  return {
    kind: 'internal_learning_record',
    externallyVerified: false,
    signed: false,
    generatedAt: now,
    learnerHandle: store.handle || 'Learner',
    concepts,
  };
}
