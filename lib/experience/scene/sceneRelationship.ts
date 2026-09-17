/**
 * Universal 3D Scene System — Scene Relationship Definition
 *
 * Models pedagogical and physical connections between semantic objects:
 * flowsTo, causes, dependsOn, contains, connectsTo, transformsInto.
 */

export type SceneRelationshipType =
  | 'connectsTo'
  | 'flowsTo'
  | 'causes'
  | 'dependsOn'
  | 'contains'
  | 'transformsInto';

export interface SceneRelationshipDefinition {
  id: string;
  sourceObjectId: string;
  targetObjectId: string;
  type: SceneRelationshipType;
  label?: string;
  description?: string;
  color?: string;
  animated?: boolean;
  flowSpeed?: number;
  particleCount?: number;
  bidirectional?: boolean;
  weight?: number;
}
