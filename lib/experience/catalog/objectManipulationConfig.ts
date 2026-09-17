/**
 * Experience Engine Milestone 3: Experience #2 — 3D Object Manipulation Catalog Config
 *
 * Demonstrates engine reusability:
 * Experience #1: Physics Simulation (Projectile Motion)
 * Experience #2: 3D Object Manipulation (Spatial Orientation / Scholar's Prism)
 *
 * Same architecture: Scene + Interaction + Challenge + Telemetry + Xira Feedback + Learner Model Evidence
 */

import {
  ExperienceConfig,
  ObjectManipulationConfig,
  ExperienceResult,
  XiraExperienceObservation,
} from '../types';
import { Quest } from '../../types';

/**
 * 3D Object Manipulation Experience Configuration:
 * "The Scholar's Prism: Harmonic Spatial Alignment"
 *
 * The learner rotates a three-dimensional multifaceted crystal artifact
 * starting from an misaligned orientation [65°, -110°, 25°] to align the
 * front Emerald Glyph Face with the observation focal reticle at [0°, 0°, 0°].
 * Target tolerance: 15.0 degrees.
 */
export const OBJECT_MANIPULATION_CONFIG: ObjectManipulationConfig = {
  objectType: 'prism',
  initialEulerDeg: [65, -110, 25],
  targetEulerDeg: [0, 0, 0],
  toleranceDeg: 15.0,
  targetFaceName: 'Emerald Resonant Face',
  allowedInteractions: ['rotate_x', 'rotate_y', 'rotate_z', 'zoom', 'reset'],
};

export const OBJECT_MANIPULATION_EXPERIENCE: ExperienceConfig = {
  id: 'exp_spatial_scholar_prism',
  title: "Scholar's Prism: Harmonic Alignment",
  conceptId: 'spatial_reasoning',
  conceptName: "Scholar's Prism: Harmonic Alignment",
  experienceType: 'OBJECT_MANIPULATION',
  challenge: {
    objective:
      'Orient the multi-faceted Scholar’s Prism so its resonant emerald face aligns squarely with the chamber focal reticle within 15° of angular tolerance.',
    instructions:
      'Click and drag to rotate the prism in 3D space, or use the precision axis buttons. Match the emerald face with the central reticle.',
    successCondition: 'Angular divergence < 15.0° from reticle focal line.',
    hints: [
      'Click and drag in 3D space to rotate freely, or use the precision axis controls.',
      'Watch the reticle resonance aura: cyan indicates searching, gold indicates proximity, emerald indicates lock-on.',
      'Reset orientation at any time if you lose spatial orientation.',
    ],
  },
  briefing: {
    title: 'The Harmonic Resonance Chamber',
    objective:
      'Orient the multi-faceted Scholar’s Prism so its resonant emerald face aligns squarely with the chamber focal reticle within 15° of angular tolerance.',
    context:
      'In spatial engineering and crystallography, 3D structures must be precisely oriented in 3-axis space (Pitch, Yaw, Roll) to channel harmonic energy.',
    targetOutcome:
      'Achieve harmonic alignment within 15° tolerance. Observe how rotating along orthogonal axes isolates spatial dimensions.',
    hints: [
      'Click and drag in 3D space to rotate freely, or use the precision axis controls.',
      'Watch the reticle resonance aura: cyan indicates searching, gold indicates proximity, emerald indicates lock-on.',
      'Reset orientation at any time if you lose spatial orientation.',
    ],
  },
  spatial: OBJECT_MANIPULATION_CONFIG,
  challenges: [
    {
      id: 'challenge_prism_alignment',
      title: 'Resonant Alignment',
      description: 'Rotate the prism to lock the Emerald Face into the reticle (angular error < 15°).',
      type: 'spatial_alignment',
      targetCriteria: {
        toleranceDeg: 15.0,
        targetEulerDeg: [0, 0, 0],
      },
      points: 100,
    },
  ],
  reflectionPrompts: [
    {
      id: 'refl_prism_axis_isolation',
      prompt:
        'When aligning an object in 3D space, did you find it easier to rotate freely or isolate one rotational plane (Pitch vs Yaw) at a time?',
      conceptConnection:
        'Complex 3D rotations can be decomposed into independent orthogonal Euler angles or quaternions.',
    },
    {
      id: 'refl_prism_overshoot',
      prompt:
        'Did you experience rotation overshoot while fine-tuning the final 15°? How did angular velocity affect your precision?',
      conceptConnection:
        'Coarse rotation brings orientation into the capture cone, while fine-tuned micro-adjustments prevent oscillation.',
    },
  ],
};

/**
 * Quest Definition integrating the 3D Object Manipulation Experience
 * seamlessly into the Canonical Quest Loop (QuestBriefingCard -> ObjectExperienceContainer -> Reflection -> Next).
 */
export const OBJECT_MANIPULATION_QUEST: Quest & Record<string, any> = {
  id: 'quest_spatial_reasoning_01',
  conceptId: 'spatial_reasoning',
  conceptName: "Scholar's Prism: 3D Spatial Orientation",
  prompt: 'When aligning a multi-axis 3D structure, how can you prevent oscillatory overshoot near the target cone?',
  options: [
    'Rotate continuously at high angular velocity across multiple axes',
    'Decompose into orthogonal axes (Yaw then Pitch) and use micro-adjustments',
    'Only rotate Roll while leaving Pitch and Yaw offset',
    'Randomly sweep until the reticle locks',
  ],
  correctIndex: 1,
  difficulty: 0.4,
  experienceType: 'OBJECT_MANIPULATION',
  experienceId: 'exp_spatial_scholar_prism',
  objective:
    'Orient the multi-faceted Scholar’s Prism so its resonant emerald face aligns squarely with the chamber focal reticle within 15° of angular tolerance.',
  briefing:
    'Enter the Resonance Chamber. Manipulate the 3D Scholar’s Prism in real-time 3-axis space to achieve harmonic orientation alignment.',
  items: [
    {
      id: 'item_spatial_prism_exp',
      type: 'interactive_simulation',
      title: "Interactive Lab: The Scholar's Prism",
      description: 'Rotate and orient the 3D artifact to achieve harmonic resonance within 15° tolerance.',
      concept: 'spatial_reasoning',
      points: 100,
      experienceType: 'OBJECT_MANIPULATION',
      experienceConfig: OBJECT_MANIPULATION_EXPERIENCE,
    },
    {
      id: 'item_spatial_reflection',
      type: 'reflection',
      title: 'Spatial Resonance Debrief',
      description: 'Reflect on 3-axis decomposition and precision alignment dynamics.',
      concept: 'spatial_reasoning',
      points: 50,
      question:
        'How does decomposing 3D rotation into isolated axes (pitch/yaw/roll) assist in complex spatial problem solving?',
    },
  ],
  experienceConfig: OBJECT_MANIPULATION_EXPERIENCE,
};

/**
 * Creates an ExperienceResult for 3D Object Manipulation
 * converting spatial interaction telemetry into the standard engine ExperienceResult contract.
 */
export const createSpatialExperienceResult = (
  config: ExperienceConfig,
  observation: XiraExperienceObservation,
  finalErrorDeg: number,
  timeSpentSeconds: number
): ExperienceResult => {
  const isAligned = finalErrorDeg <= (config.spatial?.toleranceDeg ?? 15.0);

  // Score computation: 100 base if aligned, with bonus for precision
  const precisionBonus = isAligned ? Math.max(0, Math.round(15.0 - finalErrorDeg) * 2) : 0;
  const score = isAligned ? 100 + precisionBonus : Math.max(20, Math.round(100 - finalErrorDeg * 2));

  return {
    experienceId: config.id,
    conceptId: config.conceptId,
    conceptName: config.conceptName,
    attempts: 1,
    successfulAttempts: isAligned ? 1 : 0,
    completed: isAligned,
    score,
    trialsCount: observation.totalTrials ?? 1,
    totalInteractions: observation.totalInteractions ?? 6,
    timeSpentSeconds,
    timestamp: Date.now(),
    xiraObservation: observation,
    summaryFeedback: isAligned
      ? `Harmonic lock achieved with ${finalErrorDeg.toFixed(1)}° precision! You demonstrated effective spatial orientation control.`
      : `Spatial alignment incomplete. Final error: ${finalErrorDeg.toFixed(1)}° (target: < ${config.spatial?.toleranceDeg ?? 15}°).`,
    nextActionRecommendation: isAligned
      ? 'Advance to multi-axis coupled rotation or complex geometry challenges.'
      : 'Practice single-axis isolation sweeps before attempting full 3-axis alignment.',
  };
};
