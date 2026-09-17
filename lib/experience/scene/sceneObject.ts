/**
 * Universal 3D Scene System — Scene Object Definition
 *
 * Defines declarative semantic 3D objects with physical and educational properties.
 */

export type VisualPrimitiveType =
  | 'sphere'
  | 'box'
  | 'cylinder'
  | 'capsule'
  | 'plane'
  | 'arrow'
  | 'line'
  | 'particle'
  | 'label'
  | 'orbit'
  | 'connector'
  | 'volume';

export interface SceneObjectDefinition {
  id: string;
  name: string;
  semanticMeaning: string; // Educational concept representation
  visualType: VisualPrimitiveType;
  position: [number, number, number];
  scale?: [number, number, number];
  rotation?: [number, number, number]; // Euler in radians
  color: string | number;
  emissive?: string | number;
  emissiveIntensity?: number;
  metalness?: number;
  roughness?: number;
  opacity?: number;
  transparent?: boolean;
  wireframe?: boolean;
  selectable?: boolean;
  draggable?: boolean;
  clickable?: boolean;
  highlightable?: boolean;
  educationalLabel?: string;
  educationalDescription?: string;
  category?: 'primary' | 'secondary' | 'environment' | 'indicator' | 'particle';
  data?: Record<string, any>;
}
