/**
 * Pure Deterministic 3D Spatial Math & Orientation Engine
 *
 * Implements vector kinematics, 3D angular distance calculation, tolerance verification,
 * and rotation trajectory analysis.
 *
 * Fully decoupled from Three.js and the DOM — 100% unit-testable in Node.js.
 */

export type Vector3D = [number, number, number];

export interface SpatialPatternAnalysis {
  initialErrorDeg: number;
  currentErrorDeg: number;
  minErrorAchievedDeg: number;
  isAligned: boolean;
  totalRotationTraveledDeg: number;
  overshootCount: number;
  reversalCount: number;
  coarsePhase: boolean; // Making large turns > 30 deg
  fineTuningPhase: boolean; // Making delicate turns < 10 deg near target
  hasOvershot: boolean;
  isFineTuning: boolean;
  principles: string[];
}

/**
 * Normalizes an angle in degrees to the [-180, 180] range.
 */
export function normalizeAngleDeg(deg: number): number {
  let angle = deg % 360;
  if (angle > 180) angle -= 360;
  if (angle < -180) angle += 360;
  return angle;
}

/**
 * Converts Euler angles (XYZ order in degrees) into a transformed 3D unit normal vector.
 * Default base normal [0, 0, 1] represents the front-facing vector pointing out of the screen.
 */
export function eulerToNormal(
  eulerDeg: Vector3D,
  baseNormal: Vector3D = [0, 0, 1]
): Vector3D {
  const radX = (eulerDeg[0] * Math.PI) / 180;
  const radY = (eulerDeg[1] * Math.PI) / 180;
  const radZ = (eulerDeg[2] * Math.PI) / 180;

  const cx = Math.cos(radX);
  const sx = Math.sin(radX);
  const cy = Math.cos(radY);
  const sy = Math.sin(radY);
  const cz = Math.cos(radZ);
  const sz = Math.sin(radZ);

  // Rotation matrix R = Rz * Ry * Rx
  // Apply to [x, y, z]
  const [bx, by, bz] = baseNormal;

  // Rx * v
  const x1 = bx;
  const y1 = cx * by - sx * bz;
  const z1 = sx * by + cx * bz;

  // Ry * v1
  const x2 = cy * x1 + sy * z1;
  const y2 = y1;
  const z2 = -sy * x1 + cy * z1;

  // Rz * v2
  const x3 = cz * x2 - sz * y2;
  const y3 = sz * x2 + cz * y2;
  const z3 = z2;

  // Normalize
  const mag = Math.sqrt(x3 * x3 + y3 * y3 + z3 * z3) || 1;
  return [x3 / mag, y3 / mag, z3 / mag];
}

/**
 * Calculates the angular distance in degrees between two 3D orientations (0° to 180°).
 * Uses dot product between their transformed front-facing normal vectors.
 */
export function calculateAngularDistance(
  euler1: Vector3D,
  euler2: Vector3D,
  baseNormal: Vector3D = [0, 0, 1]
): number {
  const n1 = eulerToNormal(euler1, baseNormal);
  const n2 = eulerToNormal(euler2, baseNormal);

  // Dot product: cos(theta) = n1 . n2
  const dot = n1[0] * n2[0] + n1[1] * n2[1] + n1[2] * n2[2];
  const clampedDot = Math.max(-1, Math.min(1, dot));

  const angleRad = Math.acos(clampedDot);
  return (angleRad * 180) / Math.PI;
}

/**
 * Checks whether the current orientation is within the target angular tolerance.
 */
export function isOrientationAligned(
  currentEuler: Vector3D,
  targetEuler: Vector3D,
  toleranceDeg: number = 15.0,
  baseNormal: Vector3D = [0, 0, 1]
): boolean {
  const errorDeg = calculateAngularDistance(currentEuler, targetEuler, baseNormal);
  return errorDeg <= toleranceDeg;
}

export function checkOrientationAlignment(
  currentEuler: Vector3D,
  targetEuler: Vector3D,
  toleranceDeg: number = 15.0,
  baseNormal: Vector3D = [0, 0, 1]
): { isAligned: boolean; errorDeg: number } {
  const errorDeg = calculateAngularDistance(currentEuler, targetEuler, baseNormal);
  return {
    isAligned: errorDeg <= toleranceDeg,
    errorDeg: Math.round(errorDeg * 10) / 10,
  };
}

/**
 * Analyzes the learner's manipulation trajectory across historical rotation samples.
 * Detects overshoots, directional reversals, and whether the student is fine-tuning or making coarse sweeps.
 */
export function analyzeRotationTrajectory(
  rotationHistory: Vector3D[],
  targetEuler: Vector3D,
  toleranceDeg: number = 15.0
): SpatialPatternAnalysis {
  if (rotationHistory.length === 0) {
    return {
      initialErrorDeg: 180,
      currentErrorDeg: 180,
      minErrorAchievedDeg: 180,
      isAligned: false,
      totalRotationTraveledDeg: 0,
      overshootCount: 0,
      reversalCount: 0,
      coarsePhase: false,
      fineTuningPhase: false,
      hasOvershot: false,
      isFineTuning: false,
      principles: [],
    };
  }

  const errors = rotationHistory.map((rot) =>
    calculateAngularDistance(rot, targetEuler)
  );

  const initialErrorDeg = errors[0];
  const currentErrorDeg = errors[errors.length - 1];
  const minErrorAchievedDeg = Math.min(...errors);
  const isAligned = currentErrorDeg <= toleranceDeg;

  let totalRotationTraveledDeg = 0;
  let overshootCount = 0;
  let reversalCount = 0;

  for (let i = 1; i < rotationHistory.length; i++) {
    const prev = rotationHistory[i - 1];
    const curr = rotationHistory[i];
    const stepDelta = calculateAngularDistance(prev, curr);
    totalRotationTraveledDeg += stepDelta;

    // Detect reversal: was error decreasing and then started increasing?
    if (i >= 2) {
      const errPrev2 = errors[i - 2];
      const errPrev1 = errors[i - 1];
      const errCurr = errors[i];

      if (errPrev1 < errPrev2 && errCurr > errPrev1) {
        reversalCount++;
        // If the reversal happened near target (< 30 deg), it's an overshoot
        if (errPrev1 < 30) {
          overshootCount++;
        }
      }
    }
  }

  // Check recent delta step size
  const recentSteps = rotationHistory.slice(-4);
  let avgRecentStep = 15;
  if (recentSteps.length >= 2) {
    let recentDeltaSum = 0;
    for (let j = 1; j < recentSteps.length; j++) {
      recentDeltaSum += calculateAngularDistance(recentSteps[j - 1], recentSteps[j]);
    }
    avgRecentStep = recentDeltaSum / (recentSteps.length - 1);
  }

  const fineTuningPhase = currentErrorDeg < 30 && avgRecentStep < 8;
  const coarsePhase = avgRecentStep > 25;
  const hasOvershot = overshootCount > 0;
  const isFineTuning = fineTuningPhase;

  const principles: string[] = [];
  if (isAligned) principles.push('spatial_aligned');
  if (hasOvershot) principles.push('spatial_overshot');
  if (isFineTuning) principles.push('spatial_finetuning');
  if (coarsePhase) principles.push('spatial_coarse');

  return {
    initialErrorDeg: Math.round(initialErrorDeg * 10) / 10,
    currentErrorDeg: Math.round(currentErrorDeg * 10) / 10,
    minErrorAchievedDeg: Math.round(minErrorAchievedDeg * 10) / 10,
    isAligned,
    totalRotationTraveledDeg: Math.round(totalRotationTraveledDeg * 10) / 10,
    overshootCount,
    reversalCount,
    coarsePhase,
    fineTuningPhase,
    hasOvershot,
    isFineTuning,
    principles,
  };
}
