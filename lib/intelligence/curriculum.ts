// lib/intelligence/curriculum.ts

import type { LearnerState, CurriculumPlan } from './types';
import type { SkillGraph, ConceptMastery } from '../store';

/**
 * Determine whether the curriculum should be recomposed based on material changes.
 * This is a deterministic comparison of the previous plan (if any) with the current
 * learner state and skill graph.
 */
function shouldRecompose(prev: CurriculumPlan | undefined, learnerState: LearnerState, skillGraph: SkillGraph): boolean {
  if (!prev) return true;

  // Goal text change
  if (prev.goalId !== learnerState.goalText) return true;

  // Detect mastery threshold crossings or retention risk changes
  const prevActiveSet = new Set(prev.activeConceptIds);
  const prevCompressedSet = new Set(prev.compressedConceptIds);
  const prevExpandedSet = new Set(prev.expandedConceptIds);
  const prevOptionalSet = new Set(prev.optionalConceptIds);
  const prevRemovedSet = new Set(prev.removedOrDeferredConceptIds);

  for (const concept of skillGraph.concepts) {
    const mastery = concept.masteryPercentage ?? 0;
    const risk = concept.retentionRisk ?? 0;
    const id = concept.id;
    const inActive = masteriesActive(id, mastery, risk);
    const inCompressed = masteriesCompressed(id, mastery, risk);
    const inExpanded = masteriesExpanded(id, mastery, risk);
    const inOptional = masteriesOptional(id, mastery, risk);
    const inRemoved = masteriesRemoved(id, mastery, risk);

    if (prevActiveSet.has(id) !== inActive) return true;
    if (prevCompressedSet.has(id) !== inCompressed) return true;
    if (prevExpandedSet.has(id) !== inExpanded) return true;
    if (prevOptionalSet.has(id) !== inOptional) return true;
    if (prevRemovedSet.has(id) !== inRemoved) return true;
  }

  // Exam urgency shift (<=14 days vs >14 days)
  const prevUrgent = (prev.rationale || []).some(r => r.includes('exam urgency'));
  const nowUrgent = learnerState.daysUntilExam !== undefined && learnerState.daysUntilExam <= 14;
  if (prevUrgent !== nowUrgent) return true;

  return false;
}

function masteriesActive(id: string, mastery: number, risk: number): boolean {
  return mastery >= 30 && mastery < 80 && risk <= 0.35;
}
function masteriesCompressed(id: string, mastery: number, risk: number): boolean {
  return mastery >= 80;
}
function masteriesExpanded(id: string, mastery: number, risk: number): boolean {
  return mastery < 30 || risk > 0.35;
}
function masteriesOptional(id: string, mastery: number, risk: number): boolean {
  return mastery >= 60 && mastery < 80 && risk <= 0.35;
}
function masteriesRemoved(id: string, mastery: number, risk: number): boolean {
  return mastery >= 95 && risk < 0.2;
}

/**
 * Produce a deterministic CurriculumPlan based on the learner state and skill graph.
 */
export function recomposeCurriculum(
  learnerState: LearnerState,
  skillGraph: SkillGraph,
  previousPlan?: CurriculumPlan
): CurriculumPlan {
  const activeConceptIds: string[] = [];
  const compressedConceptIds: string[] = [];
  const expandedConceptIds: string[] = [];
  const optionalConceptIds: string[] = [];
  const removedOrDeferredConceptIds: string[] = [];
  const blockedConceptIds: string[] = []; // No prerequisite data in current model
  const prerequisiteConceptIds: string[] = [];
  const rationale: string[] = [];

  for (const concept of skillGraph.concepts) {
    const { id, masteryPercentage = 0, retentionRisk = 0 } = concept;
    if (masteriesCompressed(id, masteryPercentage, retentionRisk)) {
      compressedConceptIds.push(id);
      rationale.push(`Concept ${id} mastered (${masteryPercentage}%) – compressing.`);
    } else if (masteriesExpanded(id, masteryPercentage, retentionRisk)) {
      expandedConceptIds.push(id);
      rationale.push(`Concept ${id} needs expansion (mastery ${masteryPercentage}% or risk ${retentionRisk}).`);
    } else if (masteriesActive(id, masteryPercentage, retentionRisk)) {
      activeConceptIds.push(id);
    } else if (masteriesOptional(id, masteryPercentage, retentionRisk)) {
      optionalConceptIds.push(id);
    }

    if (masteriesRemoved(id, masteryPercentage, retentionRisk)) {
      removedOrDeferredConceptIds.push(id);
      rationale.push(`Concept ${id} removed/deferred (high mastery ${masteryPercentage}% low risk).`);
    }
  }

  // Add any goal‑specific rationale
  if (learnerState.daysUntilExam !== undefined && learnerState.daysUntilExam <= 14) {
    rationale.push(`Exam is near (${learnerState.daysUntilExam} days) – prioritize relevant concepts.`);
  }

  const basePlan: CurriculumPlan = {
    goalId: learnerState.goalText,
    version: 1,
    generatedAt: new Date().toISOString(),
    activeConceptIds,
    compressedConceptIds,
    expandedConceptIds,
    blockedConceptIds,
    optionalConceptIds,
    prerequisiteConceptIds,
    removedOrDeferredConceptIds,
    rationale,
    confidence: 'HIGH',
  };

  if (!previousPlan) {
    return basePlan;
  }

  // If nothing materially changed, reuse previous plan (preserve version & timestamp)
  if (!shouldRecompose(previousPlan, learnerState, skillGraph)) {
    return previousPlan;
  }

  // Increment version and update timestamps
  return {
    ...basePlan,
    version: previousPlan.version + 1,
    generatedAt: new Date().toISOString(),
  };
}

export default recomposeCurriculum;
