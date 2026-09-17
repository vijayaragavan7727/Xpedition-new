/**
 * Universal 3D Scene System — Scene Camera & Lighting Configuration
 */

export interface CameraWaypoint {
  id: string;
  name: string;
  position: [number, number, number];
  lookAt: [number, number, number];
  fov?: number;
  durationSeconds?: number;
}

export interface SceneCameraConfig {
  initialPosition: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
  near?: number;
  far?: number;
  orbitControls?: boolean;
  minDistance?: number;
  maxDistance?: number;
  waypoints?: CameraWaypoint[];
}

export interface SceneLightingConfig {
  ambientColor: string;
  ambientIntensity: number;
  directionalColor: string;
  directionalIntensity: number;
  directionalPosition: [number, number, number];
  pointLights?: Array<{
    color: string;
    intensity: number;
    position: [number, number, number];
    distance?: number;
  }>;
}
