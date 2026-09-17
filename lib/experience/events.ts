/**
 * Xpedition Experience Engine v1 — Canonical Event Model
 *
 * Defines the standard lifecycle and interaction events that flow through
 * the unified Experience Orchestrator for telemetry, observation, and analysis.
 */

export type CanonicalEventType =
  | 'experience_started'
  | 'prediction_submitted'
  | 'interaction_started'
  | 'interaction_changed'
  | 'challenge_attempted'
  | 'validation_requested'
  | 'feedback_shown'
  | 'hint_requested'
  | 'experience_completed'
  | 'experience_reset';

export interface ExperienceEvent<TPayload = Record<string, any>> {
  id: string;
  type: CanonicalEventType | string;
  experienceId: string;
  conceptId: string;
  timestamp: number;
  attemptNumber: number;
  payload: TPayload;
}

/**
 * Helper to construct a canonical experience event.
 */
export function createExperienceEvent<TPayload = Record<string, any>>(
  type: CanonicalEventType | string,
  experienceId: string,
  conceptId: string,
  attemptNumber: number,
  payload: TPayload = {} as TPayload
): ExperienceEvent<TPayload> {
  return {
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type,
    experienceId,
    conceptId,
    timestamp: Date.now(),
    attemptNumber,
    payload,
  };
}
