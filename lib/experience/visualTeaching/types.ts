/**
 * Xpedition Visual Teaching Mode Engine v1 — Core Types & Contracts
 *
 * Defines canonical teaching modes, declarative visual plans,
 * entities, stages, controls, and telemetry specifications.
 */

import { EducationalSource, LearningKnowledgeBundle } from '../../intelligence/sources';

export type TeachingMode =
  | 'FULL_3D'
  | 'MOTION_VISUAL'
  | 'INTERACTIVE_VISUAL'
  | 'EXPLODED_VISUAL'
  | 'TRANSFORMATION_VISUAL'
  | '2D_FALLBACK';

export interface DeviceCapabilities {
  hasWebGL: boolean;
  prefersReducedMotion: boolean;
  isLowPowerDevice?: boolean;
  viewportWidth?: number;
}

export interface TeachingModeSelectionResult {
  primaryMode: TeachingMode;
  secondaryMode?: TeachingMode;
  rationale: string;
  recommendedControls?: string[];
  confidence: number; // 0.0 - 1.0
  fallbackReason?: string;
}

export interface VisualEntity {
  id: string;
  label: string;
  role: 'primary' | 'input' | 'output' | 'catalyst' | 'component' | 'indicator';
  color?: string;
  initialState?: Record<string, any>;
  description?: string;
  geometryType?: 'cube' | 'sphere' | 'cylinder' | 'mesh' | 'svg_shape';
}

export interface VisualRelationship {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  type: 'flows_to' | 'transforms_into' | 'attaches_to' | 'proportional_to' | 'causes' | 'inhibits';
  label: string;
  equation?: string;
}

export interface MotionStage {
  stageId: string;
  order: number;
  title: string;
  narrative: string;
  durationMs: number;
  focusEntityId?: string;
  visualState: Record<string, any>;
  highlightEntityIds?: string[];
}

export interface TransformationStage {
  stageId: string;
  title: string;
  stateLabel: string;
  description: string;
  stateData: Record<string, any>;
  keyTransformationMechanism: string;
}

export interface ExplodedComponent {
  id: string;
  name: string;
  functionDescription: string;
  materialOrType?: string;
  separatedOffset: { x: number; y: number; z?: number };
  assembledPosition: { x: number; y: number; z?: number };
  color: string;
  subComponents?: string[];
}

export interface ParameterControl {
  name: string;
  label: string;
  unit?: string;
  min: number;
  max: number;
  defaultValue: number;
  step?: number;
  description?: string;
  widgetType?: 'slider' | 'toggle' | 'stepper';
}

export interface QuickCheckQuestion {
  id: string;
  prompt: string;
  options: Array<{
    id: string;
    label: string;
    isCorrect: boolean;
    explanation: string;
  }>;
  hint?: string;
}

export interface VisualAccessibilityMetadata {
  ariaLabel: string;
  accessibleDescription: string;
  screenReaderSummary: string;
  reducedMotionAlternativeText: string;
  keyboardShortcuts?: Array<{ key: string; description: string }>;
}

export interface VisualPerformanceHints {
  recommendedFps: number;
  useWebGL: boolean;
  estimatedMemoryMb: number;
  lazyLoadResources?: boolean;
}

export interface VisualTeachingPlan {
  planId: string;
  conceptId: string;
  title: string;
  learningObjective: string;
  mode: TeachingMode;
  secondaryMode?: TeachingMode;
  entities: VisualEntity[];
  relationships: VisualRelationship[];
  stages: MotionStage[];
  transformationStages?: TransformationStage[];
  explodedComponents?: ExplodedComponent[];
  interactiveControls: ParameterControl[];
  quickCheck: QuickCheckQuestion;
  sourceReferences?: EducationalSource[];
  knowledgeBundle?: LearningKnowledgeBundle;
  fallbackAvailable: boolean;
  accessibility: VisualAccessibilityMetadata;
  performance: VisualPerformanceHints;
}

export interface RepresentationSwitchOption {
  targetMode: TeachingMode;
  reason: string;
  prompt: string;
}
