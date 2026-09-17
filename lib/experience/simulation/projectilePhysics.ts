/**
 * Pure Deterministic Projectile Motion Physics Simulation
 *
 * Implements exact Newtonian kinematics for projectile trajectory, flight time,
 * maximum range, peak height, and target collision detection.
 *
 * Fully decoupled from React and DOM rendering — 100% unit-testable in Node.js.
 */

export interface TrajectoryPoint {
  x: number;
  y: number;
  z: number;
  t: number;
  vx: number;
  vy: number;
}

export interface LaunchParameters {
  launchAngleDeg: number; // Angle from horizontal in degrees (0 to 90)
  initialVelocity: number; // Speed in m/s (v0 > 0)
  gravity?: number; // Acceleration due to gravity in m/s^2 (default 9.81)
  launchHeight?: number; // Starting elevation y0 in meters (default 1.0)
  targetDistance: number; // Target distance from origin in meters
  targetTolerance?: number; // Hit tolerance radius in meters (default 1.5)
}

export interface SimulationResult {
  points: TrajectoryPoint[];
  flightTime: number; // seconds
  peakHeight: number; // meters
  peakTime: number; // seconds to peak
  landingDistance: number; // meters from origin (X at ground contact)
  targetDistance: number; // meters
  targetError: number; // landingDistance - targetDistance (positive = overshoot, negative = undershoot)
  isHit: boolean;
  impactVelocity: number; // speed at ground contact (m/s)
  initialVx: number; // horizontal velocity component
  initialVy: number; // vertical velocity component
}

/**
 * Calculates complete projectile kinematics and samples discrete trajectory points.
 */
export function simulateProjectile(params: LaunchParameters, timeStep: number = 0.02): SimulationResult {
  const {
    launchAngleDeg,
    initialVelocity,
    gravity = 9.81,
    launchHeight = 1.0,
    targetDistance,
    targetTolerance = 1.5,
  } = params;

  // Clamp angle to valid physical range [0, 90]
  const clampedAngle = Math.max(0, Math.min(90, launchAngleDeg));
  const angleRad = (clampedAngle * Math.PI) / 180;

  // Component velocities
  const v0 = Math.max(0, initialVelocity);
  const vx0 = v0 * Math.cos(angleRad);
  const vy0 = v0 * Math.sin(angleRad);

  // Time to reach peak height: t_peak = vy0 / g
  const peakTime = vy0 / gravity;
  // Maximum height: h_max = y0 + vy0^2 / (2g)
  const peakHeight = launchHeight + (vy0 * vy0) / (2 * gravity);

  // Total flight time to reach y = 0:
  // y(t) = y0 + vy0*t - 0.5*g*t^2 = 0
  // 0.5*g*t^2 - vy0*t - y0 = 0
  // Quadratic formula: t = (vy0 + sqrt(vy0^2 + 2*g*y0)) / g
  const discriminant = vy0 * vy0 + 2 * gravity * launchHeight;
  const flightTime = (vy0 + Math.sqrt(Math.max(0, discriminant))) / gravity;

  // Horizontal range at ground contact
  const landingDistance = vx0 * flightTime;

  // Target error and collision
  const targetError = landingDistance - targetDistance;
  const isHit = Math.abs(targetError) <= targetTolerance;

  // Impact velocity at ground contact
  const vyImpact = vy0 - gravity * flightTime;
  const impactVelocity = Math.sqrt(vx0 * vx0 + vyImpact * vyImpact);

  // Sample trajectory points
  const points: TrajectoryPoint[] = [];
  const safeTimeStep = Math.max(0.005, timeStep);
  let t = 0;

  while (t <= flightTime) {
    const x = vx0 * t;
    const y = Math.max(0, launchHeight + vy0 * t - 0.5 * gravity * t * t);
    const vy = vy0 - gravity * t;

    points.push({
      x,
      y,
      z: 0,
      t,
      vx: vx0,
      vy,
    });

    t += safeTimeStep;
  }

  // Ensure exact final landing point is recorded at t = flightTime
  if (points.length === 0 || points[points.length - 1].t < flightTime) {
    points.push({
      x: landingDistance,
      y: 0,
      z: 0,
      t: flightTime,
      vx: vx0,
      vy: vyImpact,
    });
  }

  return {
    points,
    flightTime,
    peakHeight,
    peakTime,
    landingDistance,
    targetDistance,
    targetError,
    isHit,
    impactVelocity,
    initialVx: vx0,
    initialVy: vy0,
  };
}

/**
 * Calculates the theoretical launch angle required to hit a target at a given velocity.
 * For flat ground (y0 = 0): sin(2*theta) = (g * R) / v0^2
 * Returns null if the target is unreachable at the given velocity.
 */
export function calculateRequiredAngles(
  velocity: number,
  targetDistance: number,
  gravity: number = 9.81
): { lowAngleDeg: number; highAngleDeg: number } | null {
  const vSq = velocity * velocity;
  const val = (gravity * targetDistance) / vSq;

  if (val > 1.0) {
    return null; // Target is beyond maximum possible range at this velocity
  }

  const twoThetaRad = Math.asin(val);
  const lowAngleDeg = (twoThetaRad * 180) / (2 * Math.PI);
  const highAngleDeg = 90 - lowAngleDeg;

  return {
    lowAngleDeg: Math.round(lowAngleDeg * 10) / 10,
    highAngleDeg: Math.round(highAngleDeg * 10) / 10,
  };
}

/**
 * Calculates theoretical maximum range at the optimal launch angle (~45° for y0=0).
 */
export function calculateMaxRange(
  velocity: number,
  gravity: number = 9.81,
  launchHeight: number = 0
): { maxRange: number; optimalAngleDeg: number } {
  if (launchHeight === 0) {
    return {
      maxRange: (velocity * velocity) / gravity,
      optimalAngleDeg: 45,
    };
  }

  // For y0 > 0, optimal angle is slightly below 45 degrees:
  // theta_opt = arcsin(1 / sqrt(2 + 2*g*y0 / v0^2))
  const term = 1 / Math.sqrt(2 + (2 * gravity * launchHeight) / (velocity * velocity));
  const optimalAngleRad = Math.asin(term);
  const optimalAngleDeg = (optimalAngleRad * 180) / Math.PI;

  const sim = simulateProjectile({
    launchAngleDeg: optimalAngleDeg,
    initialVelocity: velocity,
    gravity,
    launchHeight,
    targetDistance: 0,
  });

  return {
    maxRange: sim.landingDistance,
    optimalAngleDeg: Math.round(optimalAngleDeg * 10) / 10,
  };
}
