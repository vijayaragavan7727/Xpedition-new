/**
 * Xpedition Intelligence Layer v1 — Assessment Intelligence
 *
 * Deterministically derives pedagogical assessment signals from experiential evidence
 * and normalized learner state.
 *
 * Guaranteed Invariants:
 * 1. Zero AI provider calls (0 tokens, deterministic, local, pure logic).
 * 2. Does not mutate BKT or UserStoreData.
 * 3. Maps experiential evidence into canonical AssessmentSignal types.
 */

import { AssessmentResult, AssessmentSignal, LearnerState, NextBestAction } from './types';
import { ExperienceLearnerEvidence } from '../experience/types';

export function evaluateExperienceAssessment(
  evidence: ExperienceLearnerEvidence,
  learnerState: LearnerState
): AssessmentResult {
  const evidenceSignals: string[] = [];
  const codeEv = evidence.codeEvidence;
  const hintsCount = evidence.hintsRequested || 0;

  // Signal collection
  if (codeEv) {
    if (codeEv.detectedBug) evidenceSignals.push(`bug_${codeEv.detectedBug}`);
    if (codeEv.correctionPattern) evidenceSignals.push(`correction_${codeEv.correctionPattern}`);
    if (codeEv.independentCompletion) evidenceSignals.push('independent_completion');
    if (codeEv.hintsUsed > 0) evidenceSignals.push(`hints_used_${codeEv.hintsUsed}`);
    if (codeEv.runs > 0) evidenceSignals.push(`total_runs_${codeEv.runs}`);
  }

  if (hintsCount > 0) {
    evidenceSignals.push(`hints_requested_${hintsCount}`);
  }

  // 1. Confidence Misalignment: Confident ('known') but failed
  const isHighConfidenceWrong =
    (evidence.confidence === 'known' && !evidence.isSuccess) ||
    (learnerState.highConfidenceWrong !== undefined && learnerState.highConfidenceWrong >= 1);

  if (isHighConfidenceWrong) {
    return {
      signal: 'CONFIDENCE_MISALIGNMENT',
      confidence: 0.95,
      reason: 'Reported high confidence but failed the challenge. Self-perception is misaligned with actual execution.',
      evidenceSignals,
      recommendedActionType: 'CORRECT_MISCONCEPTION',
    };
  }

  // 2. Misconception: Explicit repeated error or recognized bug pattern
  const hasReassignmentBug =
    codeEv?.detectedBug === 'reassignment' ||
    evidence.detectedPrinciple === 'repeated_assignment_pattern';
  const hasRepeatedMistakes = Boolean(learnerState.repeatedMistakes);

  if (hasReassignmentBug || hasRepeatedMistakes) {
    const bugName = codeEv?.detectedBug || 'reassignment_vs_accumulation';
    return {
      signal: 'MISCONCEPTION',
      confidence: 0.9,
      reason: 'Demonstrated repeated misconception: assigning total = number overwrites prior iteration state instead of accumulating.',
      detectedMisconception: bugName,
      evidenceSignals: [...evidenceSignals, `misconception_${bugName}`],
      recommendedActionType: 'CORRECT_MISCONCEPTION',
    };
  }

  // 3. Recall Failure: High retention risk coupled with failure
  if (learnerState.forgettingRisk > 0.35 && !evidence.isSuccess) {
    return {
      signal: 'RECALL_FAILURE',
      confidence: 0.85,
      reason: `Concept retention decayed (${Math.round(learnerState.forgettingRisk * 100)}% risk). The learner is struggling to recall foundational mechanics.`,
      evidenceSignals: [...evidenceSignals, 'decayed_retention'],
      recommendedActionType: 'SPACED_REVIEW',
    };
  }

  // 4. Knowledge Gap: Multiple failed attempts with heavy hint reliance
  const isStrugglingWithHints =
    !evidence.isSuccess &&
    (hintsCount >= 2 || (codeEv && codeEv.hintsUsed >= 2) || (codeEv && codeEv.runs >= 3));

  if (isStrugglingWithHints) {
    return {
      signal: 'KNOWLEDGE_GAP',
      confidence: 0.88,
      reason: 'Persistent execution mismatch despite iterative hints indicates a fundamental gap in syntax or mental model.',
      evidenceSignals: [...evidenceSignals, 'multi_hint_struggle'],
      recommendedActionType: 'CORRECT_MISCONCEPTION',
    };
  }

  // 5. Strong Mastery: Clean, independent, successful completion
  const isIndependentSuccess =
    evidence.isSuccess &&
    (codeEv?.independentCompletion === true || hintsCount === 0) &&
    (evidence.accuracy >= 0.8 || (codeEv && codeEv.runs <= 3));

  if (isIndependentSuccess) {
    return {
      signal: 'STRONG_MASTERY',
      confidence: 0.95,
      reason: 'Solved the interactive challenge independently with zero hint reliance and verified output correctness.',
      evidenceSignals: [...evidenceSignals, 'clean_independent_solve'],
      recommendedActionType: learnerState.masteryPercentage >= 80 ? 'HARDER_CHALLENGE' : 'PRACTICE_CONCEPT',
    };
  }

  // 6. Careless Error: First attempt failure without hint reliance
  if (!evidence.isSuccess && evidence.trialsCount <= 1 && hintsCount === 0) {

    return {
      signal: 'CARELESS_ERROR',
      confidence: 0.75,
      reason: 'Initial execution missed target without seeking assistance; likely a quick typographical or syntax slip.',
      evidenceSignals: [...evidenceSignals, 'single_trial_slip'],
      recommendedActionType: 'PRACTICE_CONCEPT',
    };
  }

  // 7. Difficulty Mismatch: Many trials, low accuracy
  if (!evidence.isSuccess && (evidence.trialsCount >= 5 || (codeEv && codeEv.runs >= 5))) {
    return {
      signal: 'DIFFICULTY_MISMATCH',
      confidence: 0.8,
      reason: 'High attempt count without progress signals that task difficulty outpaces current competency.',
      evidenceSignals: [...evidenceSignals, 'high_churn_failure'],
      recommendedActionType: 'PRACTICE_CONCEPT',
    };
  }

  // 8. Default: Insufficient or intermediate evidence
  return {
    signal: 'INSUFFICIENT_EVIDENCE',
    confidence: 0.5,
    reason: 'Sufficient evidence collected to record progress, but requires further trials for conclusive diagnostic classification.',
    evidenceSignals,
    recommendedActionType: 'PRACTICE_CONCEPT',
  };
}
