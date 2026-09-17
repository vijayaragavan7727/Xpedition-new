/**
 * Xpedition Experience Engine v1 — Core Types & Contracts
 *
 * Defines the foundational abstractions for converting learning concepts into
 * interactive, observable, 3D/simulation learning experiences.
 *
 * Architecture:
 * Experience Engine = body (Scene, Interaction, Simulation, Challenge, Telemetry)
 * Xira = brain (Observation, Analysis, Adaptation, Guidance)
 */

export type UniversalExperienceFamily =
  | 'SIMULATION'
  | '3D_MANIPULATION'
  | 'BUILDER'
  | 'EXPLORER'
  | 'VIRTUAL_LAB'
  | 'INTERACTIVE_DIAGRAM'
  | 'SCENARIO'
  | 'CODE_LAB'
  | 'VISUAL_EXPLANATION'
  | 'PRACTICE_CHALLENGE';

export type ExperienceType =
  | 'simulation'
  | '3d_interactive'
  | 'experiment'
  | 'scenario'
  | 'PROJECTILE_SIMULATION'
  | 'OBJECT_MANIPULATION'
  | 'MOLECULE_BUILDER'
  | 'HEART_ANATOMY_EXPLORER'
  | 'CODE_DEBUGGING'
  | UniversalExperienceFamily;

export type ChallengeStage =
  | 'INTRO'
  | 'PREDICTING'
  | 'CONFIGURING'
  | 'LAUNCHING'
  | 'BUILDING'
  | 'CHECKING'
  | 'OBSERVING'
  | 'COMPLETED';

// ---------------------------------------------------------------------------
// 1. Controls Configuration
// ---------------------------------------------------------------------------

export interface RangeControlConfig {
  id: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  description?: string;
}

export interface ChoiceControlConfig {
  id: string;
  label: string;
  options: Array<{ value: string | number; label: string }>;
  defaultValue: string | number;
}

export type ControlConfig = RangeControlConfig | ChoiceControlConfig;

// ---------------------------------------------------------------------------
// 2. Simulation Configuration
// ---------------------------------------------------------------------------

export interface ProjectileSimulationConfig {
  gravity: number; // m/s^2 (e.g. 9.81)
  targetDistance: number; // meters from origin (e.g. 25)
  targetTolerance: number; // meters hit radius (e.g. 1.5)
  launchHeight: number; // launch elevation from ground (e.g. 1.0)
  maxAirTime?: number; // max simulation duration cutoff
  groundLevel?: number; // Y = 0
}

// ---------------------------------------------------------------------------
// 3. Challenge Configuration
// ---------------------------------------------------------------------------

export interface PredictionOption {
  id: string;
  label: string;
  description?: string;
  isCorrect?: boolean;
}

export interface PredictionChallengeConfig {
  prompt: string;
  explanation: string;
  options: PredictionOption[];
}

export interface ChallengeConfig {
  objective: string;
  instructions: string;
  successCondition: string;
  maxAttempts?: number;
  prediction?: PredictionChallengeConfig;
  hints: string[];
}

// ---------------------------------------------------------------------------
// 4. Scene & Domain Configurations
// ---------------------------------------------------------------------------

export interface SceneConfig {
  environmentType: 'field' | 'lab' | 'space' | 'nocturne';
  camera: {
    initialPosition: [number, number, number];
    lookAt: [number, number, number];
    fov: number;
  };
  lighting: {
    ambientColor: string;
    ambientIntensity: number;
    directionalColor: string;
    directionalPosition: [number, number, number];
  };
}

export interface ObjectManipulationConfig {
  objectType: 'cube' | 'prism' | 'polyhedron' | 'artifact';
  initialEulerDeg: [number, number, number];
  targetEulerDeg: [number, number, number];
  toleranceDeg: number;
  targetFaceName: string;
  allowedInteractions: Array<'rotate' | 'drag' | 'zoom' | 'reset' | 'rotate_x' | 'rotate_y' | 'rotate_z'>;
}

export interface MoleculeAtomDefinition {
  id: string;
  elementSymbol: 'H' | 'O' | 'C' | 'N' | string;
  elementName: string;
  valence: number;
  maxBonds: number;
  colorHex: number;
  radius: number;
  initialPosition: [number, number, number];
}

export interface MoleculeBond {
  id: string;
  fromAtomId: string;
  toAtomId: string;
  bondOrder?: number; // default 1 (single bond)
}

export interface MoleculeBuilderConfig {
  moleculeId: string;
  moleculeFormula: string;
  moleculeName: string;
  atoms: MoleculeAtomDefinition[];
  targetBonds: Array<{ fromAtomId: string; toAtomId: string }>;
  valenceRules: Record<string, number>;
  disallowedBonds?: Array<{
    fromType: string;
    toType: string;
    reason: string;
  }>;
  prediction?: PredictionChallengeConfig;
}

// ---------------------------------------------------------------------------
// 5. Master Experience Configuration Contract
// ---------------------------------------------------------------------------

export interface ExperienceConfig<TSimConfig = any> {
  id: string;
  type?: ExperienceType;
  experienceType?: ExperienceType;
  conceptId: string;
  conceptName: string;
  title: string;
  subtitle?: string;
  difficulty?: number; // 0.0 to 1.0
  scene?: SceneConfig;
  controls?: ControlConfig[];
  simulation?: TSimConfig; // Optional for simulation experiences
  spatial?: ObjectManipulationConfig; // For 3D object manipulation
  manipulation?: ObjectManipulationConfig; // Alias
  molecule?: MoleculeBuilderConfig; // For 3D molecule building
  challenge: ChallengeConfig;
  briefing?: {
    title: string;
    objective: string;
    context: string;
    targetOutcome: string;
    hints: string[];
  };
  challenges?: any[];
  reflectionPrompts?: any[];
}

// ---------------------------------------------------------------------------
// 6. Telemetry & Observation
// ---------------------------------------------------------------------------

export type TelemetryEventType =
  | 'experience_started'
  | 'control_changed'
  | 'prediction_submitted'
  | 'launch'
  | 'trajectory_completed'
  | 'target_hit'
  | 'target_missed'
  | 'retry'
  | 'hint_requested'
  | 'experience_completed'
  | 'object_selected'
  | 'rotation_started'
  | 'rotation_changed'
  | 'zoom_changed'
  | 'target_checked'
  | 'task_completed'
  | 'task_failed'
  | 'atom_selected'
  | 'atom_dragged'
  | 'atom_repositioned'
  | 'bond_attempted'
  | 'bond_created'
  | 'bond_rejected'
  | 'bond_removed'
  | 'molecule_checked'
  | 'molecule_completed'
  | 'structure_selected'
  | 'structure_inspected'
  | 'heart_rotated'
  | 'heart_zoomed'
  | 'flow_started'
  | 'flow_step_completed'
  | 'flow_error'
  | 'challenge_started'
  | 'challenge_answered'
  | 'challenge_correct'
  | 'challenge_incorrect'
  | 'heart_experience_completed'
  | 'code_experience_started'
  | 'code_edited'
  | 'code_run'
  | 'output_observed'
  | 'code_submitted'
  | 'code_validation_failed'
  | 'code_validation_passed'
  | 'code_reset'
  | 'code_experience_completed'
  | 'adaptive_loop_started'
  | 'learner_state_updated'
  | 'assessment_signal_generated'
  | 'next_action_selected'
  | 'next_experience_resolved'
  | 'next_quest_resolved'
  | 'next_quest_opened'
  | 'adaptive_route_clicked'
  | 'topic_teaching_started'
  | 'topic_resolved'
  | 'experience_composed'
  | 'scene_loaded'
  | 'object_inspected'
  | 'object_interacted'
  | 'teaching_step_completed'
  | 'teaching_session_completed'
  | 'adaptive_next_step_resolved'
  | 'visual_teaching_started'
  | 'visual_stage_started'
  | 'visual_stage_completed'
  | 'visual_interaction_started'
  | 'visual_parameter_changed'
  | 'visual_prediction_submitted'
  | 'visual_prediction_correct'
  | 'visual_prediction_incorrect'
  | 'visual_hint_requested'
  | 'visual_mode_completed'
  | 'visual_quick_check_submitted'
  | 'visual_teaching_completed'
  | 'visual_mode_switched'
  | 'visual_next_concept_selected'
  // Phase E: Legal & Trust Telemetry
  | 'privacy_viewed'
  | 'terms_viewed'
  | 'ai_transparency_viewed'
  | 'sources_viewed'
  | 'data_export_requested'
  | 'account_deletion_requested';

export interface TelemetryEvent {
  id: string;
  type: TelemetryEventType;
  experienceId: string;
  conceptId: string;
  timestamp: number;
  attemptNumber: number;
  payload: Record<string, any>;
}

export interface TrialRecord {
  trialIndex: number;
  timestamp: number;
  // Projectile fields (optional)
  angleDeg?: number;
  velocity?: number;
  landingDistance?: number;
  targetDistance?: number;
  targetError?: number; // landingDistance - targetDistance
  flightTime?: number;
  peakHeight?: number;
  // Spatial manipulation fields (optional)
  currentEulerDeg?: [number, number, number];
  targetEulerDeg?: [number, number, number];
  angularErrorDeg?: number;
  rotationDeltaDeg?: number;
  // Molecular builder fields (optional)
  bondsCount?: number;
  validBondsCount?: number;
  invalidBondAttempt?: { from: string; to: string; reason: string };
  isMoleculeComplete?: boolean;
  // Common fields
  predictedOptionId?: string;
  isPredictionCorrect?: boolean;
  isHit: boolean;
}

export interface XiraExperienceObservation {
  experienceId: string;
  conceptId: string;
  conceptName: string;
  totalAttempts: number;
  successfulAttempts: number;
  totalTrials?: number;
  successfulTrials?: number;
  targetHits?: number;
  totalInteractions?: number;
  hasSucceeded: boolean;
  predictionAccuracy: number; // 0.0 to 1.0
  trials: TrialRecord[];
  angleHistory: number[];
  velocityHistory: number[];
  errorHistory: number[];
  hintsRequested: number;
  patternSummary: string;
  detectedPrinciple:
    | 'exploring'
    | 'approaching_45'
    | 'overshooting'
    | 'undershooting'
    | 'mastered'
    | 'spatial_coarse'
    | 'spatial_finetuning'
    | 'spatial_overshot'
    | 'spatial_aligned'
    | 'bond_valid'
    | 'bond_invalid_hh'
    | 'valence_exceeded'
    | 'molecule_incomplete'
    | 'molecule_complete'
    | 'cardiovascular_flow_mastery'
    | 'repeated_valve_confusion'
    | 'correct_flow_sequence'
    | 'structure_identified'
    | 'flow_direction_error'
    | 'anatomy_mastered'
    | 'reassignment_bug_detected'
    | 'accumulation_operator_corrected'
    | 'code_output_mismatch'
    | 'code_debugged_successfully'
    | 'meaningful_code_correction'
    | 'repeated_assignment_pattern';
  principlesIdentified?: string[];
}

export interface XiraExperienceFeedback {
  observation: string;
  pedagogicalInsight: string;
  suggestedNextMove: string;
  tone: 'encouraging' | 'guiding' | 'celebrating';
  isOptimal: boolean;
}

// ---------------------------------------------------------------------------
// 7. Learner Model Integration Evidence
// ---------------------------------------------------------------------------

export interface ExperienceLearnerEvidence {
  conceptId: string;
  conceptName: string;
  isSuccess: boolean;
  accuracy: number;
  trialsCount: number;
  confidence: 'known' | 'unsure';
  timeSpentSeconds: number;
  timestamp: number;
  hintsRequested?: number;
  detectedPrinciple?: string;
  codeEvidence?: CodeEvidence;
}

// ---------------------------------------------------------------------------
// 8. Canonical Experience Result Contract
// ---------------------------------------------------------------------------

export interface ExperienceResult {
  experienceId: string;
  experienceType?: ExperienceType;
  conceptId: string;
  concept?: string; // Backward-compatible alias
  conceptName: string;
  attempts: number;
  successfulAttempts: number;
  completed?: boolean;
  score?: number;
  summary?: any;
  evidence?: any;
  trialsCount?: number;
  totalInteractions?: number;
  summaryFeedback?: string;
  nextActionRecommendation?: string;
  xiraObservation?: XiraExperienceObservation;
  predictionEvidence?: {
    selectedOptionId?: string;
    isCorrect?: boolean;
    prompt?: string;
  };
  interactionEvidence?: {
    angleSequence: number[];
    velocitySequence: number[];
    finalLandingDistance: number;
    targetDistance: number;
    finalError: number;
    isHit: boolean;
  };
  spatialEvidence?: {
    initialEulerDeg: [number, number, number];
    finalEulerDeg: [number, number, number];
    targetEulerDeg: [number, number, number];
    angularErrorDeg: number;
    isAligned: boolean;
  };
  molecularEvidence?: {
    moleculeFormula: string;
    bondsFormed: MoleculeBond[];
    targetBondsMatched: boolean;
    invalidBondAttemptsCount: number;
    valenceSatisfied: boolean;
  };
  anatomyEvidence?: {
    structuresExplored: string[];
    structuresIdentified: string[];
    flowStepsCompleted: number;
    flowErrors: number;
    challengeScore: number;
    challengeAttempts: number;
    isFlowComplete: boolean;
    isComplete: boolean;
  };
  codeEvidence?: CodeEvidence;
  finalResult?: 'target_hit' | 'close_attempt' | 'exploratory_complete';
  timeSpentSeconds: number;
  evidenceSignals?: string[];
  timestamp: number;
}

export interface CodeEvidence {
  runs: number;
  edits: number;
  outputAttempts: number;
  validationAttempts: number;
  hintsUsed: number;
  correctionCount: number;
  detectedBug?: string;
  correctionPattern?: string;
  independentCompletion: boolean;
  finalSuccess: boolean;
}

