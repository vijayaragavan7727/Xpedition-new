/**
 * Xpedition Experience Engine v1 — Canonical Validation Contract
 *
 * Defines the standard validation result and validator signature
 * used by all experiences regardless of domain (kinematics, 3D spatial, chemistry).
 */

export type ValidationStatus = 'VALID' | 'INVALID' | 'INCOMPLETE' | 'COMPLETE';

export interface CanonicalValidationResult<TEvidence = Record<string, any>, TMetadata = Record<string, any>> {
  status: ValidationStatus;
  isValid: boolean;
  isComplete: boolean;
  score?: number;
  reason?: string;
  evidence?: TEvidence;
  feedback?: string;
  metadata?: TMetadata;
}

/**
 * Generic contract for a domain-specific validator function.
 * Given a domain state and target configuration, produces a CanonicalValidationResult.
 */
export type ExperienceValidator<TState = any, TConfig = any, TEvidence = any> = (
  state: TState,
  config: TConfig
) => CanonicalValidationResult<TEvidence>;
