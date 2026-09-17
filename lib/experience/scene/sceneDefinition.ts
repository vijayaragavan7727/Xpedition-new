/**
 * Universal 3D Scene System — Universal Scene Definition
 *
 * Declarative specification of an interactive 3D learning world.
 */

import { SceneObjectDefinition } from './sceneObject';
import { SceneRelationshipDefinition } from './sceneRelationship';
import { SceneInteractionConfig } from './sceneInteraction';
import { SceneCameraConfig, SceneLightingConfig } from './sceneCamera';
import { SceneAnimationDefinition } from './sceneAnimation';

export type SceneEnvironmentType =
  | 'noir_grid'
  | 'deep_space'
  | 'laboratory'
  | 'biology_cell'
  | 'physics_track'
  | 'abstract_math';

export interface SceneAnnotation {
  id: string;
  targetObjectId?: string;
  worldPosition: [number, number, number];
  title: string;
  body: string;
  formula?: string;
  badge?: string;
}

export interface UniversalSceneDefinition {
  id: string;
  title: string;
  topicId: string;
  environmentType: SceneEnvironmentType;
  backgroundColor: string;
  camera: SceneCameraConfig;
  lighting: SceneLightingConfig;
  objects: SceneObjectDefinition[];
  relationships: SceneRelationshipDefinition[];
  interactions: SceneInteractionConfig[];
  animations: SceneAnimationDefinition[];
  annotations?: SceneAnnotation[];
  showGroundGrid?: boolean;
  groundGridSize?: number;
  physicsConfig?: {
    gravity?: number;
    friction?: number;
    timeScale?: number;
    restitution?: number;
  };
}

export * from './sceneObject';
export * from './sceneRelationship';
export * from './sceneInteraction';
export * from './sceneCamera';
export * from './sceneAnimation';
