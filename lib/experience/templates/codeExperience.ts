/**
 * Xpedition Experience Engine v1 — Code Experience Template
 *
 * Generic archetype for interactive programming and code-debugging experiences:
 * Code -> Edit -> Run -> Output -> Inspect -> Correct -> Verify
 *
 * Integrates directly with the unified ExperienceDefinition, ExperienceOrchestrator,
 * canonical validation, feedback, and telemetry models.
 */

import { ExperienceDefinition } from '../experienceDefinition';
import { CodeEvidence } from '../types';

export interface CodeEnvironmentConfig {
  language: 'python' | 'javascript' | 'sql';
  initialCode: string;
  expectedOutput: string;
  readOnlyLines?: number[];
  executionTimeoutMs?: number;
  allowReset?: boolean;
}

export interface CodeExperienceState {
  sourceCode: string;
  lastOutput?: string;
  executionStatus?: 'idle' | 'running' | 'success' | 'output_mismatch' | 'error';
  runCount: number;
  editCount: number;
  hasRun: boolean;
  hintsUsed: number;
  isComplete: boolean;
  consecutiveMismatches: number;
  detectedBug?: string;
  correctionPattern?: string;
}

export interface CodeExperienceConfig<TEnvConfig extends CodeEnvironmentConfig = CodeEnvironmentConfig> {
  environment: TEnvConfig;
  targetConcept: string;
  objective: string;
  hints: string[];
}

export type CodeExperience<
  TEnvConfig extends CodeEnvironmentConfig = CodeEnvironmentConfig,
  TEvidence = CodeEvidence
> = ExperienceDefinition<CodeExperienceConfig<TEnvConfig>, CodeExperienceState, TEvidence>;
