/**
 * Universal 3D Scene System — Scene Interaction Definition
 *
 * Defines interactive widgets, controls, and behavioral triggers
 * that students manipulate to experiment with scientific principles.
 */

export type InteractionWidgetType =
  | 'slider'
  | 'toggle'
  | 'button'
  | 'select'
  | 'rotator'
  | 'dragger';

export interface SceneInteractionConfig {
  id: string;
  targetObjectId?: string;
  parameterName: string;
  label: string;
  unit?: string;
  widgetType: InteractionWidgetType;
  min?: number;
  max?: number;
  step?: number;
  defaultValue: number | string | boolean;
  options?: Array<{ value: string | number; label: string }>;
  description?: string;
  educationalImpact: string; // Explains what changing this variable tests/proves
  affectsProperties?: string[]; // e.g., ['position.x', 'scale', 'velocity']
}
