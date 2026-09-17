/**
 * Xpedition Experience Engine v1 — Experience Templates
 *
 * Generic archetypes that define standard patterns for experiences:
 * 1. SimulationExperience: parameters -> simulate -> observe -> validate
 * 2. ManipulationExperience: object -> transform -> target -> tolerance -> validate
 * 3. BuilderExperience: components -> relationships -> rules -> target -> validate
 */

import { ExperienceDefinition } from '../experienceDefinition';
import { CanonicalValidationResult } from '../validation';

// ---------------------------------------------------------------------------
// 1. Simulation Experience Template
// ---------------------------------------------------------------------------

export interface SimulationParameters {
  [key: string]: number | string | boolean;
}

export interface SimulationTrajectoryPoint {
  x: number;
  y: number;
  z?: number;
  time?: number;
}

export interface SimulationState<TParams extends SimulationParameters = SimulationParameters> {
  parameters: TParams;
  isSimulating: boolean;
  hasExecuted: boolean;
  trajectory?: SimulationTrajectoryPoint[];
  landingPoint?: { x: number; y: number; z?: number };
}

export interface SimulationConfig<TParams extends SimulationParameters = SimulationParameters> {
  parameterBounds: Record<string, { min: number; max: number; step: number; defaultValue: number }>;
  target: { position: { x: number; y: number; z?: number }; tolerance: number };
  simulate: (params: TParams) => {
    trajectory: SimulationTrajectoryPoint[];
    landingPoint: { x: number; y: number; z?: number };
  };
}

export type SimulationExperience<
  TParams extends SimulationParameters = SimulationParameters,
  TEvidence = Record<string, any>
> = ExperienceDefinition<SimulationConfig<TParams>, SimulationState<TParams>, TEvidence>;

// ---------------------------------------------------------------------------
// 2. Manipulation Experience Template
// ---------------------------------------------------------------------------

export interface ManipulationTransform {
  position?: [number, number, number];
  rotation: [number, number, number]; // Euler angles in degrees
  scale?: [number, number, number];
}

export interface ManipulationState {
  currentTransform: ManipulationTransform;
  initialTransform: ManipulationTransform;
  targetTransform: ManipulationTransform;
  angularErrorDeg: number;
  isAligned: boolean;
  history: Array<{ timestamp: number; transform: ManipulationTransform }>;
}

export interface ManipulationConfig {
  objectType: string;
  initialEulerDeg: [number, number, number];
  targetEulerDeg: [number, number, number];
  toleranceDeg: number;
  allowedInteractions: string[];
}

export type ManipulationExperience<TEvidence = Record<string, any>> = ExperienceDefinition<
  ManipulationConfig,
  ManipulationState,
  TEvidence
>;

// ---------------------------------------------------------------------------
// 3. Builder Experience Template
// ---------------------------------------------------------------------------

export interface BuilderComponent {
  id: string;
  type: string;
  properties: Record<string, any>;
}

export interface BuilderRelationship {
  id: string;
  fromId: string;
  toId: string;
  type: string;
  properties?: Record<string, any>;
}

export interface BuilderState<
  TComponent extends BuilderComponent = BuilderComponent,
  TRelationship extends BuilderRelationship = BuilderRelationship
> {
  components: TComponent[];
  relationships: TRelationship[];
  selectedComponentId?: string;
  validationIssues?: string[];
  isComplete: boolean;
}

export interface BuilderConfig<
  TComponent extends BuilderComponent = BuilderComponent,
  TRelationship extends BuilderRelationship = BuilderRelationship
> {
  targetStructureId: string;
  availableComponents: TComponent[];
  targetRelationships: Array<{ fromId: string; toId: string; type?: string }>;
  rules: {
    canConnect: (
      from: TComponent,
      to: TComponent,
      existing: TRelationship[]
    ) => { allowed: boolean; reason?: string };
    isTargetReached: (
      components: TComponent[],
      relationships: TRelationship[]
    ) => boolean;
  };
}

export type BuilderExperience<
  TComponent extends BuilderComponent = BuilderComponent,
  TRelationship extends BuilderRelationship = BuilderRelationship,
  TEvidence = Record<string, any>
> = ExperienceDefinition<
  BuilderConfig<TComponent, TRelationship>,
  BuilderState<TComponent, TRelationship>,
  TEvidence
>;

// ---------------------------------------------------------------------------
// 4. Code Experience Template
// ---------------------------------------------------------------------------
export * from './codeExperience';
