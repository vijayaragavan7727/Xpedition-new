/**
 * Experience #1 — Projectile Motion Configuration
 *
 * Declarative configuration for the first proof experience of the Xpedition Experience Engine.
 */

import { ExperienceConfig } from '../types';

export const PROJECTILE_MOTION_EXPERIENCE: ExperienceConfig = {
  id: 'exp_projectile_motion_01',
  type: 'simulation',
  conceptId: 'projectile_motion',
  conceptName: 'Projectile Motion & Kinematics',
  title: 'Projectile Motion',
  subtitle: 'Master how launch angle and velocity determine range and trajectory.',
  difficulty: 0.35,

  scene: {
    environmentType: 'nocturne',
    camera: {
      initialPosition: [12, 8, 22],
      lookAt: [14, 2, 0],
      fov: 50,
    },
    lighting: {
      ambientColor: '#1a1f36',
      ambientIntensity: 0.8,
      directionalColor: '#818cf8',
      directionalPosition: [10, 20, 15],
    },
  },

  controls: [
    {
      id: 'angle',
      label: 'Launch Angle',
      unit: '°',
      min: 10,
      max: 80,
      step: 1,
      defaultValue: 25,
      description: 'Angle of the cannon above horizontal ground.',
    },
    {
      id: 'velocity',
      label: 'Launch Velocity',
      unit: 'm/s',
      min: 10,
      max: 30,
      step: 1,
      defaultValue: 18,
      description: 'Initial firing speed of the projectile.',
    },
  ],

  simulation: {
    gravity: 9.81,
    targetDistance: 25.0,
    targetTolerance: 1.5,
    launchHeight: 1.0,
  },

  challenge: {
    objective: 'Hit the target pad located exactly 25 meters downrange.',
    instructions: 'Form a hypothesis, adjust your variables, fire the cannon, and observe the flight path.',
    successCondition: 'Landing within 1.5m of the target pad.',
    maxAttempts: 6,
    prediction: {
      prompt: 'At a launch speed of 18 m/s, which angle will reach the 25-meter target?',
      explanation:
        'A 45° angle harmonizes horizontal velocity with airtime, producing the maximum range (over 30m at 18 m/s). At 18 m/s, angles near 25° or 65° will land closest to 25m!',
      options: [
        {
          id: 'opt_shallow',
          label: '25° (Shallow Angle)',
          description: 'High forward speed, but low hang time.',
          isCorrect: true, // Range ~25.2m!
        },
        {
          id: 'opt_optimal',
          label: '45° (Maximum Range)',
          description: 'Balanced speed and hang time (will overshoot 25m at 18 m/s).',
          isCorrect: false,
        },
        {
          id: 'opt_steep',
          label: '75° (Steep High Arc)',
          description: 'Maximum hang time, but very low forward speed.',
          isCorrect: false,
        },
      ],
    },
    hints: [
      'Observe your flight time: if the projectile lands in under 1.5 seconds, try increasing your angle to get more airtime.',
      'Notice that launch angles symmetrically distributed around 45° (like 30° and 60°) achieve nearly identical ranges!',
      'At 18 m/s, 45° will overshoot 25m and land near 34m. To hit 25m, you either need ~25° (low trajectory) or ~65° (high arc).',
    ],
  },
};

/**
 * Canonical Quest instance for Projectile Motion embedded experience.
 */
export const PROJECTILE_MOTION_QUEST = {
  id: 'quest_projectile_motion_01',
  conceptId: 'projectile_motion',
  conceptName: 'Projectile Motion & Kinematics',
  prompt: 'A cannon fires a projectile downrange toward a target. Which physical principle determines maximum achievable range?',
  options: [
    'A shallow 25° angle minimizes aerodynamic drag and lands furthest',
    'A 45° angle harmonizes forward velocity with flight time to achieve peak range',
    'A steep 75° angle maximizes airtime and always lands furthest',
    'Launch angle has no impact on total horizontal flight distance',
  ],
  correctIndex: 1,
  explanation: 'At 45°, horizontal speed and vertical hang time are optimally balanced for peak distance on level ground.',
  difficulty: 0.35,
  experienceType: 'PROJECTILE_SIMULATION',
  experienceId: 'exp_projectile_motion_01',
  objective: 'Hit the target pad located exactly 25 meters downrange.',
  briefing: 'Discover how launch angle and velocity govern physical trajectories. You will form a hypothesis, fire a virtual cannon, and discover the universal angle for maximum range.',
};

/**
 * Creates a structured ExperienceResult from observation and simulation output.
 */
export function createExperienceResultFromTelemetry(
  config: ExperienceConfig,
  observation: import('../types').XiraExperienceObservation,
  lastSimResult: import('../simulation/projectilePhysics').SimulationResult,
  timeSpentSeconds: number = 30
): import('../types').ExperienceResult {
  const isHit = observation.hasSucceeded || lastSimResult.isHit;
  const closestError = observation.errorHistory.length > 0
    ? Math.min(...observation.errorHistory.map((e) => Math.abs(e)))
    : Math.abs(lastSimResult.targetError);

  const finalResult: import('../types').ExperienceResult['finalResult'] = isHit
    ? 'target_hit'
    : closestError <= 3.0
    ? 'close_attempt'
    : 'exploratory_complete';

  const evidenceSignals: string[] = [];
  if (isHit) {
    evidenceSignals.push('Demonstrated mastery of trajectory angle-velocity alignment');
  } else if (closestError <= 3.0) {
    evidenceSignals.push('Approached target within near-miss tolerance');
  } else {
    evidenceSignals.push('Explored projectile parameter space');
  }

  if (observation.angleHistory.some((a) => a >= 40 && a <= 50)) {
    evidenceSignals.push('Investigated optimal 45° maximum-range angle');
  }

  return {
    experienceId: config.id,
    conceptId: config.conceptId,
    conceptName: config.conceptName,
    attempts: observation.totalAttempts,
    successfulAttempts: observation.successfulAttempts,
    predictionEvidence: observation.trials[0]?.predictedOptionId
      ? {
          selectedOptionId: observation.trials[0].predictedOptionId,
          isCorrect: observation.trials[0].isPredictionCorrect,
          prompt: config.challenge.prediction?.prompt,
        }
      : undefined,
    interactionEvidence: {
      angleSequence: observation.angleHistory,
      velocitySequence: observation.velocityHistory,
      finalLandingDistance: lastSimResult.landingDistance,
      targetDistance: lastSimResult.targetDistance,
      finalError: lastSimResult.targetError,
      isHit,
    },
    finalResult,
    timeSpentSeconds,
    evidenceSignals,
    timestamp: Date.now(),
  };
}
