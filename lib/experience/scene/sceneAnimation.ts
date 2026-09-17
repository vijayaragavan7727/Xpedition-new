/**
 * Universal 3D Scene System — Declarative Animation Behaviors
 */

export type AnimationBehaviorType =
  | 'pulse'
  | 'rotate'
  | 'orbit'
  | 'translate'
  | 'flow'
  | 'wobble'
  | 'oscillate';

export interface SceneAnimationDefinition {
  id: string;
  targetObjectId: string;
  type: AnimationBehaviorType;
  speed: number;
  axis?: [number, number, number];
  radius?: number;
  center?: [number, number, number];
  minScale?: number;
  maxScale?: number;
  direction?: [number, number, number];
  conditionParameter?: string; // Only animates if parameter evaluates truthy/positive
}
