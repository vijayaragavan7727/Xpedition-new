/**
 * Xpedition Experience Engine v1 — Unified Experience Catalog
 *
 * Exposes canonical ExperienceDefinitions for all registered experiences:
 * 1. PROJECTILE_SIMULATION (Simulation template)
 * 2. OBJECT_MANIPULATION (Manipulation template)
 * 3. MOLECULE_BUILDER (Builder template)
 *
 * Each definition satisfies the canonical ExperienceDefinition contract and
 * connects to its domain-specific simulation/rules without leaking math into
 * the core orchestrator.
 */

import { ExperienceDefinition } from '../experienceDefinition';
import { CanonicalValidationResult } from '../validation';
import { createExperienceFeedback } from '../feedback';

// Domain imports for Projectile Motion
import {
  PROJECTILE_MOTION_EXPERIENCE,
  PROJECTILE_MOTION_QUEST,
  createExperienceResultFromTelemetry,
} from './projectileMotionConfig';
import { simulateProjectile } from '../simulation/projectilePhysics';
import { defaultXiraExperienceAdvisor } from '../xira/xiraExperienceAdvisor';

// Domain imports for Object Manipulation
import {
  OBJECT_MANIPULATION_CONFIG,
  OBJECT_MANIPULATION_EXPERIENCE,
  OBJECT_MANIPULATION_QUEST,
  createSpatialExperienceResult,
} from './objectManipulationConfig';
import { calculateAngularDistance, isOrientationAligned } from '../simulation/spatialMath';

// Domain imports for Molecule Builder
import {
  H2O_MOLECULE_CONFIG,
  MOLECULE_BUILDER_EXPERIENCE,
  MOLECULE_BUILDER_QUEST,
  createMoleculeExperienceResult,
} from './moleculeBuilderConfig';
import { evaluateMoleculeStructure } from '../domain/moleculeRules';
import { MoleculeBond } from '../types';

// Domain imports for Heart Anatomy
import {
  HEART_STRUCTURES,
  HEART_CHALLENGES,
  HEART_ANATOMY_EXPERIENCE,
  HEART_ANATOMY_QUEST,
  createHeartExperienceResult,
} from './heartAnatomyConfig';
import {
  HeartAnatomyState,
  evaluateHeartAnatomyCompletion,
} from '../domain/heartAnatomyRules';

// Domain imports for Code Debugging
import {
  CODE_DEBUGGING_EXPERIENCE,
  CODE_DEBUGGING_QUEST,
  CODE_DEBUGGING_DEFINITION,
  createCodeExperienceResult,
} from './codeDebuggingConfig';

// Re-export existing configs for backward compatibility
export {
  PROJECTILE_MOTION_EXPERIENCE,
  PROJECTILE_MOTION_QUEST,
  createExperienceResultFromTelemetry,
  OBJECT_MANIPULATION_CONFIG,
  OBJECT_MANIPULATION_EXPERIENCE,
  OBJECT_MANIPULATION_QUEST,
  createSpatialExperienceResult,
  H2O_MOLECULE_CONFIG,
  MOLECULE_BUILDER_EXPERIENCE,
  MOLECULE_BUILDER_QUEST,
  createMoleculeExperienceResult,
  HEART_STRUCTURES,
  HEART_CHALLENGES,
  HEART_ANATOMY_EXPERIENCE,
  HEART_ANATOMY_QUEST,
  createHeartExperienceResult,
  CODE_DEBUGGING_EXPERIENCE,
  CODE_DEBUGGING_QUEST,
  CODE_DEBUGGING_DEFINITION,
  createCodeExperienceResult,
};

// ---------------------------------------------------------------------------
// 1. CANONICAL DEFINITION: PROJECTILE_SIMULATION
// ---------------------------------------------------------------------------

export interface ProjectileState {
  angle: number;
  velocity: number;
  hasFired: boolean;
  landingDistance: number;
  targetError: number;
}

export const PROJECTILE_SIMULATION_DEFINITION: ExperienceDefinition<
  typeof PROJECTILE_MOTION_EXPERIENCE,
  ProjectileState,
  { landingDistance: number; targetError: number; isHit: boolean }
> = {
  id: PROJECTILE_MOTION_EXPERIENCE.id,
  type: 'PROJECTILE_SIMULATION',
  conceptId: PROJECTILE_MOTION_EXPERIENCE.conceptId,
  title: PROJECTILE_MOTION_EXPERIENCE.title,
  objective: PROJECTILE_MOTION_EXPERIENCE.challenge.objective,
  difficulty: PROJECTILE_MOTION_EXPERIENCE.difficulty ?? 0.35,
  template: 'simulation',
  configuration: PROJECTILE_MOTION_EXPERIENCE,
  initialState: {
    angle: 25,
    velocity: 18,
    hasFired: false,
    landingDistance: 0,
    targetError: -25,
  },
  hints: PROJECTILE_MOTION_EXPERIENCE.challenge.hints,
  predictionChallenge: PROJECTILE_MOTION_EXPERIENCE.challenge.prediction,
  validator: (state, config) => {
    const sim = simulateProjectile({
      launchAngleDeg: state.angle,
      initialVelocity: state.velocity,
      gravity: config.simulation?.gravity ?? 9.81,
      targetDistance: config.simulation?.targetDistance ?? 25.0,
      targetTolerance: config.simulation?.targetTolerance ?? 1.5,
      launchHeight: config.simulation?.launchHeight ?? 1.0,
    });

    const isComplete = sim.isHit;
    const status = isComplete ? 'COMPLETE' : 'INVALID';

    return {
      status,
      isValid: isComplete,
      isComplete,
      score: isComplete ? 100 : Math.max(20, Math.round(100 - Math.abs(sim.targetError) * 10)),
      reason: isComplete
        ? 'Target pad hit within tolerance.'
        : sim.targetError < 0
        ? `Undershot target by ${Math.abs(sim.targetError).toFixed(1)}m.`
        : `Overshot target by ${sim.targetError.toFixed(1)}m.`,
      evidence: {
        landingDistance: sim.landingDistance,
        targetError: sim.targetError,
        isHit: sim.isHit,
      },
      feedback: isComplete
        ? 'Direct hit! Angle and velocity harmonized.'
        : `Landed at ${sim.landingDistance.toFixed(1)}m. Adjust launch angle.`,
    };
  },
  feedbackGenerator: (validation, state) => {
    const isHit = validation.isComplete;
    const trial = {
      trialIndex: 1,
      timestamp: Date.now(),
      angleDeg: state.angle,
      velocity: state.velocity,
      targetError: validation.evidence?.targetError ?? 0,
      landingDistance: validation.evidence?.landingDistance ?? 0,
      targetDistance: 25.0,
      isHit,
    };
    const observation = {
      experienceId: PROJECTILE_MOTION_EXPERIENCE.id,
      conceptId: PROJECTILE_MOTION_EXPERIENCE.conceptId,
      conceptName: PROJECTILE_MOTION_EXPERIENCE.conceptName,
      totalAttempts: 1,
      successfulAttempts: isHit ? 1 : 0,
      hasSucceeded: isHit,
      predictionAccuracy: 1.0,
      trials: [trial],
      angleHistory: [state.angle],
      velocityHistory: [state.velocity],
      errorHistory: [validation.evidence?.targetError ?? 0],
      hintsRequested: 0,
      patternSummary: isHit ? 'Target hit' : 'Trajectory adjusted',
      detectedPrinciple: isHit ? ('mastered' as const) : ('exploring' as const),
    };

    const xiraFeedback = defaultXiraExperienceAdvisor.generateFeedback(observation, trial);
    return createExperienceFeedback(
      isHit ? 'SUCCESS' : 'CORRECTION',
      xiraFeedback.observation,
      {
        pedagogicalInsight: xiraFeedback.pedagogicalInsight,
        suggestedAction: xiraFeedback.suggestedNextMove,
        confidence: xiraFeedback.isOptimal ? 1.0 : 0.85,
      }
    );
  },
};

// ---------------------------------------------------------------------------
// 2. CANONICAL DEFINITION: OBJECT_MANIPULATION
// ---------------------------------------------------------------------------

export interface SpatialState {
  currentEulerDeg: [number, number, number];
  targetEulerDeg: [number, number, number];
  toleranceDeg: number;
  angularErrorDeg: number;
  isAligned: boolean;
}

export const OBJECT_MANIPULATION_DEFINITION: ExperienceDefinition<
  typeof OBJECT_MANIPULATION_CONFIG,
  SpatialState,
  { angularErrorDeg: number; isAligned: boolean; currentEulerDeg: [number, number, number] }
> = {
  id: OBJECT_MANIPULATION_EXPERIENCE.id,
  type: 'OBJECT_MANIPULATION',
  conceptId: OBJECT_MANIPULATION_EXPERIENCE.conceptId,
  title: OBJECT_MANIPULATION_EXPERIENCE.title,
  objective: OBJECT_MANIPULATION_EXPERIENCE.challenge.objective,
  difficulty: 0.4,
  template: 'manipulation',
  configuration: OBJECT_MANIPULATION_CONFIG,
  initialState: {
    currentEulerDeg: [65, -110, 25],
    targetEulerDeg: OBJECT_MANIPULATION_CONFIG.targetEulerDeg,
    toleranceDeg: OBJECT_MANIPULATION_CONFIG.toleranceDeg,
    angularErrorDeg: calculateAngularDistance([65, -110, 25], OBJECT_MANIPULATION_CONFIG.targetEulerDeg),
    isAligned: false,
  },
  hints: OBJECT_MANIPULATION_EXPERIENCE.challenge.hints,
  validator: (state, config) => {
    const errorDeg = calculateAngularDistance(state.currentEulerDeg, config.targetEulerDeg);
    const isAligned = isOrientationAligned(state.currentEulerDeg, config.targetEulerDeg, config.toleranceDeg);
    const status = isAligned ? 'COMPLETE' : 'INVALID';

    return {
      status,
      isValid: isAligned,
      isComplete: isAligned,
      score: isAligned ? 100 : Math.max(20, Math.round(100 - errorDeg * 2)),
      reason: isAligned
        ? 'Resonant face squarely aligned with reticle focal line.'
        : `Angular divergence is ${errorDeg.toFixed(1)}° (tolerance: < ${config.toleranceDeg}°).`,
      evidence: {
        angularErrorDeg: errorDeg,
        isAligned,
        currentEulerDeg: state.currentEulerDeg,
      },
      feedback: isAligned
        ? `Harmonic lock achieved with ${errorDeg.toFixed(1)}° precision!`
        : `Prism orientation divergence: ${errorDeg.toFixed(1)}°. Adjust Pitch/Yaw.`,
    };
  },
  feedbackGenerator: (validation, state) => {
    const errorDeg = validation.evidence?.angularErrorDeg ?? 90;
    const observation = {
      experienceId: OBJECT_MANIPULATION_EXPERIENCE.id,
      conceptId: OBJECT_MANIPULATION_EXPERIENCE.conceptId,
      conceptName: OBJECT_MANIPULATION_EXPERIENCE.conceptName,
      totalAttempts: 1,
      successfulAttempts: validation.isComplete ? 1 : 0,
      hasSucceeded: validation.isComplete,
      predictionAccuracy: 1.0,
      trials: [],
      angleHistory: [],
      velocityHistory: [],
      errorHistory: [errorDeg],
      hintsRequested: 0,
      patternSummary: 'Rotating artifact',
      detectedPrinciple: validation.isComplete ? ('spatial_aligned' as const) : ('spatial_coarse' as const),
    };

    const xiraFeedback = defaultXiraExperienceAdvisor.generateSpatialFeedback(
      observation,
      errorDeg,
      OBJECT_MANIPULATION_CONFIG.toleranceDeg
    );

    return createExperienceFeedback(
      validation.isComplete ? 'SUCCESS' : 'CORRECTION',
      xiraFeedback.observation,
      {
        pedagogicalInsight: xiraFeedback.pedagogicalInsight,
        suggestedAction: xiraFeedback.suggestedNextMove,
        confidence: xiraFeedback.isOptimal ? 1.0 : 0.8,
      }
    );
  },
};

// ---------------------------------------------------------------------------
// 3. CANONICAL DEFINITION: MOLECULE_BUILDER
// ---------------------------------------------------------------------------

export interface MoleculeBuilderState {
  bonds: MoleculeBond[];
  invalidAttemptsCount: number;
  lastRejectedReason?: string;
  isComplete: boolean;
}

export const MOLECULE_BUILDER_DEFINITION: ExperienceDefinition<
  typeof H2O_MOLECULE_CONFIG,
  MoleculeBuilderState,
  {
    bondsCount: number;
    validBondsCount: number;
    missingBondsCount: number;
    isComplete: boolean;
  }
> = {
  id: 'exp_molecule_water_builder',
  type: 'MOLECULE_BUILDER',
  conceptId: 'molecular_bonding',
  title: 'Water (H₂O) Molecular Synthesis',
  objective: 'Construct a stable water (H₂O) molecule by creating two covalent bonds between oxygen and hydrogen.',
  difficulty: 0.35,
  template: 'builder',
  configuration: H2O_MOLECULE_CONFIG,
  initialState: {
    bonds: [],
    invalidAttemptsCount: 0,
    isComplete: false,
  },
  hints: MOLECULE_BUILDER_EXPERIENCE.challenge.hints,
  predictionChallenge: H2O_MOLECULE_CONFIG.prediction,
  validator: (state, config) => {
    const evaluation = evaluateMoleculeStructure(state.bonds, config);
    const isComplete = evaluation.isComplete;
    const isValid = evaluation.validBondsCount > 0 || isComplete;
    const status = isComplete ? 'COMPLETE' : isValid ? 'VALID' : 'INCOMPLETE';

    return {
      status,
      isValid,
      isComplete,
      score: isComplete ? 100 : Math.max(20, evaluation.validBondsCount * 40),
      reason: isComplete
        ? 'All target covalent bonds satisfied. Water (H₂O) octet stable.'
        : `Formed ${evaluation.validBondsCount} of ${config.targetBonds.length} required bonds.`,
      evidence: {
        bondsCount: state.bonds.length,
        validBondsCount: evaluation.validBondsCount,
        missingBondsCount: evaluation.missingBondsCount,
        isComplete,
      },
      feedback: isComplete
        ? 'Stable H₂O synthesized successfully!'
        : `Molecule incomplete: ${evaluation.missingBondsCount} bond(s) remaining.`,
    };
  },
  feedbackGenerator: (validation, state) => {
    const bondsCount = validation.evidence?.validBondsCount ?? state.bonds.length;
    const observation = {
      experienceId: 'exp_molecule_water_builder',
      conceptId: 'molecular_bonding',
      conceptName: 'Molecular Bonding & Valence Rules',
      totalAttempts: 1,
      successfulAttempts: validation.isComplete ? 1 : 0,
      hasSucceeded: validation.isComplete,
      predictionAccuracy: 1.0,
      trials: [],
      angleHistory: [],
      velocityHistory: [],
      errorHistory: [],
      hintsRequested: 0,
      patternSummary: 'Building water molecule',
      detectedPrinciple: validation.isComplete ? ('molecule_complete' as const) : ('molecule_incomplete' as const),
    };

    const xiraFeedback = defaultXiraExperienceAdvisor.generateMoleculeFeedback(
      observation,
      bondsCount,
      validation.isComplete,
      state.lastRejectedReason
    );

    return createExperienceFeedback(
      validation.isComplete ? 'SUCCESS' : bondsCount > 0 ? 'ENCOURAGEMENT' : 'CORRECTION',
      xiraFeedback.observation,
      {
        pedagogicalInsight: xiraFeedback.pedagogicalInsight,
        suggestedAction: xiraFeedback.suggestedNextMove,
        confidence: xiraFeedback.isOptimal ? 1.0 : 0.8,
      }
    );
  },
};

// ---------------------------------------------------------------------------
// 4. CANONICAL DEFINITION: HEART_ANATOMY_EXPLORER (Manipulation Template)
// ---------------------------------------------------------------------------

export const HEART_ANATOMY_DEFINITION: ExperienceDefinition<
  typeof HEART_ANATOMY_EXPERIENCE,
  HeartAnatomyState,
  {
    exploredCount: number;
    challengesPassed: number;
    isComplete: boolean;
    flowCompleted: boolean;
  }
> = {
  id: HEART_ANATOMY_EXPERIENCE.id,
  type: 'HEART_ANATOMY_EXPLORER',
  conceptId: HEART_ANATOMY_EXPERIENCE.conceptId,
  title: HEART_ANATOMY_EXPERIENCE.title,
  objective: HEART_ANATOMY_EXPERIENCE.challenge.objective,
  difficulty: 0.3,
  template: 'manipulation',
  configuration: HEART_ANATOMY_EXPERIENCE,
  initialState: {
    currentEulerDeg: [0, 0, 0],
    inspectedStructures: [],
    flowStepIndex: 0,
    isFlowActive: false,
    flowErrors: 0,
    flowCompleted: false,
    currentChallengeIndex: 0,
    challengeAnswers: {},
    isComplete: false,
  },
  hints: HEART_ANATOMY_EXPERIENCE.challenge.hints,
  predictionChallenge: HEART_ANATOMY_EXPERIENCE.challenge.prediction,
  validator: (state, config) => {
    const evaluation = evaluateHeartAnatomyCompletion(state);
    const status = evaluation.isComplete ? 'COMPLETE' : state.inspectedStructures.length > 0 ? 'VALID' : 'INCOMPLETE';

    return {
      status,
      isValid: evaluation.isComplete || state.inspectedStructures.length > 0,
      isComplete: evaluation.isComplete,
      score: evaluation.score,
      reason: evaluation.reason,
      evidence: {
        exploredCount: evaluation.exploredCount,
        challengesPassed: evaluation.challengesPassed,
        isComplete: evaluation.isComplete,
        flowCompleted: state.flowCompleted,
      },
      feedback: evaluation.isComplete
        ? 'Cardiac anatomy & circulation circuit mastered!'
        : `Explored ${evaluation.exploredCount} structures, solved ${evaluation.challengesPassed} challenges.`,
    };
  },
  feedbackGenerator: (validation, state) => {
    const observation = {
      experienceId: HEART_ANATOMY_EXPERIENCE.id,
      conceptId: HEART_ANATOMY_EXPERIENCE.conceptId,
      conceptName: HEART_ANATOMY_EXPERIENCE.conceptName,
      totalAttempts: 1,
      successfulAttempts: validation.isComplete ? 1 : 0,
      hasSucceeded: validation.isComplete,
      predictionAccuracy: 1.0,
      trials: [],
      angleHistory: [],
      velocityHistory: [],
      errorHistory: [],
      hintsRequested: 0,
      patternSummary: 'Inspecting heart anatomy',
      detectedPrinciple: validation.isComplete ? ('mastered' as const) : ('exploring' as const),
    };

    const xiraFeedback = defaultXiraExperienceAdvisor.generateHeartFeedback(observation, {
      exploredCount: state.inspectedStructures.length,
      isFlowComplete: state.flowCompleted,
      flowErrors: state.flowErrors,
      challengesCorrect: Object.values(state.challengeAnswers).filter((a) => a.isCorrect).length,
    });

    return createExperienceFeedback(
      validation.isComplete ? 'SUCCESS' : state.inspectedStructures.length >= 4 ? 'ENCOURAGEMENT' : 'CORRECTION',
      xiraFeedback.observation,
      {
        pedagogicalInsight: xiraFeedback.pedagogicalInsight,
        suggestedAction: xiraFeedback.suggestedNextMove,
        confidence: xiraFeedback.isOptimal ? 1.0 : 0.85,
      }
    );
  },
};
