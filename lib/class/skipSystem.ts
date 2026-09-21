/**
 * Xpedition Universal Skip System & Learning Acceleration
 *
 * Core Principle: "Skip the activity. Never skip the learning evidence."
 *
 * Invariants:
 * 1. Skip NEVER awards mastery or increases BKT ability (theta).
 * 2. Skipping an evaluative activity generates INSUFFICIENT_EVIDENCE.
 * 3. Skipping optional content advances immediately without confirmation friction.
 * 4. Skipping evaluative activities requires confirmation to alert the learner that evidence won't be recorded.
 * 5. Buddy NEVER celebrates mastery when an activity is skipped.
 * 6. Class continuity is preserved (no route jumps, no Three.js scene recreations).
 */

import { ClassStageId } from './types';

export type SkipReason =
  | 'already_know'
  | 'move_faster'
  | 'not_now'
  | 'optional_content';

export type SkipResult =
  | 'SKIPPED'
  | 'SKIPPED_WITHOUT_EVIDENCE'
  | 'COMPLETED';

export type StageCategory =
  | 'OPTIONAL'
  | 'EVIDENCE_GENERATING'
  | 'SYSTEM_RESULT';

export interface SkipRecord {
  type: 'ACTIVITY_SKIPPED';
  stage: ClassStageId;
  stageCategory: StageCategory;
  reason: SkipReason;
  result: SkipResult;
  evidenceStatus: 'INSUFFICIENT_EVIDENCE' | 'NO_EVIDENCE_NEEDED';
  conceptId: string;
  timestamp: number;
}

export interface SkipSafetyEvaluation {
  masteryAwarded: false;
  bktUpdated: false;
  validAttempt: false;
  xpAwarded: number;
  reason: string;
}

/**
 * Categorizes a Class stage according to its evidence-generating role.
 */
export function getStageCategory(stage: ClassStageId): StageCategory {
  switch (stage) {
    case 'introduce':
    case 'explain':
    case 'explore':
    case 'observe':
      return 'OPTIONAL';

    case 'predict':
    case 'interact':
    case 'quick_check':
    case 'mission':
    case 'challenge':
    case 'assessment':
      return 'EVIDENCE_GENERATING';

    case 'feedback':
    case 'reward':
    case 'next_class':
      return 'SYSTEM_RESULT';

    default:
      return 'OPTIONAL';
  }
}

/**
 * Determines whether a stage is skippable by the learner.
 * System and result stages are not skippable as they display final outcomes.
 */
export function isStageSkippable(stage: ClassStageId): boolean {
  const category = getStageCategory(stage);
  return category === 'OPTIONAL' || category === 'EVIDENCE_GENERATING';
}

/**
 * Determines whether skipping a stage requires a confirmation warning.
 * Optional explanatory stages skip frictionlessly.
 * Evaluative stages warn the learner that evidence will not be recorded.
 */
export function requiresSkipConfirmation(stage: ClassStageId): boolean {
  return getStageCategory(stage) === 'EVIDENCE_GENERATING';
}

/**
 * Constructs an immutable SkipRecord for auditing, telemetry, and Xira adaptation.
 */
export function createSkipRecord(
  stage: ClassStageId,
  conceptId: string,
  reason: SkipReason = 'move_faster'
): SkipRecord {
  const category = getStageCategory(stage);
  const isEvaluative = category === 'EVIDENCE_GENERATING';

  return {
    type: 'ACTIVITY_SKIPPED',
    stage,
    stageCategory: category,
    reason,
    result: isEvaluative ? 'SKIPPED_WITHOUT_EVIDENCE' : 'SKIPPED',
    evidenceStatus: isEvaluative ? 'INSUFFICIENT_EVIDENCE' : 'NO_EVIDENCE_NEEDED',
    conceptId,
    timestamp: Date.now(),
  };
}

/**
 * Evaluates the safety bounds of a skip event.
 * Mathematically and architecturally guarantees that NO mastery or BKT credit is awarded.
 */
export function evaluateSkipMasterySafety(record: SkipRecord): SkipSafetyEvaluation {
  return {
    masteryAwarded: false,
    bktUpdated: false,
    validAttempt: false,
    xpAwarded: 0,
    reason:
      record.stageCategory === 'EVIDENCE_GENERATING'
        ? `Stage '${record.stage}' was skipped without providing learning evidence. Mastery remains unchanged.`
        : `Stage '${record.stage}' was an optional exploration stage. No evidence needed.`,
  };
}
