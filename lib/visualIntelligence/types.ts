/**
 * Xpedition Visual Intelligence Engine — Types & Contracts (Phase 3)
 *
 * Core domain abstractions for pedagogical visual reasoning:
 * - Visual Need Evaluation (determining if visual representation aids comprehension)
 * - Representation Type Resolution (diagrams, simulations, graphs, timelines, etc.)
 * - Pedagogical Purpose & Content Requirements
 * - Accuracy Level declaration & representation priority
 * - Stage-aware visualization requirements
 * - Smart Board presentation contract
 */

import { EducationalAsset, CachePolicy } from '../visualGeneration/types';

/**
 * Accuracy level for pedagogical representations.
 * Guides representation selection (e.g. mathematical/scientific concepts demand deterministic visuals).
 */
export type AccuracyLevel =
  | 'decorative'    // Atmospheric or thematic background
  | 'contextual'    // Historical setting, real-world context
  | 'conceptual'    // Qualitative relationship or high-level schema
  | 'scientific'    // Physically/chemically accurate elements and principles
  | 'mathematical'  // Exact geometric or coordinate precision
  | 'technical';    // Engineering blueprints, component schematics, wiring

/**
 * Pedagogical stages within a lesson where visual needs vary.
 */
export type VisualStage =
  | 'introduce'     // Initial high-level overview or real-world hook
  | 'explain'       // Detailed breakdown of principles and mechanics
  | 'demonstrate'   // Step-by-step physical or procedural walkthrough
  | 'interact'      // Active parameter manipulation or simulation
  | 'question'      // Visual stimulus for comprehension check
  | 'practice'      // Scaffolded problem solving
  | 'challenge'     // Diagnostic or edge-case reasoning
  | 'assess'        // Formal evaluation visual
  | 'feedback';     // Remedial or celebratory visual stimulus

/**
 * Supported representation types across Xpedition's multi-modal learning architecture.
 */
export type RepresentationType =
  | 'educational_illustration' // High-clarity 2D generated educational illustration
  | 'scientific_diagram'       // Structured schematic with annotated labels
  | 'interactive_simulation'   // Deterministic physics/spatial interactive canvas
  | 'graph'                    // Coordinate plots, function curves, histograms
  | 'timeline'                 // Chronological sequential event layout
  | 'map'                      // Spatial, geographic, or cartographic layout
  | 'anatomical_visual'        // Biological organ, tissue, or physiological structure
  | 'molecular_visual'         // Chemical bonding, 3D molecular ball-and-stick structure
  | 'code_visual'              // Syntax-highlighted execution flow or data structure trace
  | '3d_model'                 // Interactive WebGL/Three.js spatial model
  | 'formula_visual'           // Formatted mathematical derivation or formula breakdown
  | 'comparison_visual';       // Side-by-side or contrast layout (e.g. mitosis vs meiosis)

/**
 * Result of the Visual Need evaluation.
 */
export interface VisualNeedResult {
  needed: boolean;
  confidence: number; // Deterministic heuristic confidence [0.0 - 1.0]
  reason: string;     // Transparent, explainable rationale
}

/**
 * Pedagogical purpose detailing what learner must see and understand.
 */
export interface PedagogicalPurpose {
  learnerNotice: string[];            // Explicit visual cues learner must detect
  relationshipToEmphasize: string;    // Core relationship (e.g., current x field -> torque)
  keyObjects: string[];               // Mandatory physical or conceptual entities
  antiHallucinationGuidelines?: string[]; // Specific pitfalls or misconceptions to avoid
  labelsRequired: boolean;
  interactionRequired?: boolean;
}

/**
 * Grounded content requirements extracted from canonical curriculum sources.
 */
export interface ContentRequirements {
  requiredElements: string[];
  relationships: string[];
  labelsRequired: boolean;
  verifiedFacts?: string[];
  incomplete?: boolean;
  missingFactsReason?: string;
}

/**
 * Primary domain object: The structured visual requirement formulated by Visual Intelligence.
 */
export interface VisualRequirement {
  conceptId: string;
  subject?: string;
  topic?: string;
  learningObjective?: string;
  stage: VisualStage;
  visualNeeded: boolean;
  confidence: number;
  reason: string;
  visualType?: RepresentationType;
  accuracyLevel?: AccuracyLevel;
  pedagogicalPurpose?: PedagogicalPurpose;
  contentRequirements?: ContentRequirements;
  existingAssetCandidates?: EducationalAsset[];
  fallbackRepresentation?: RepresentationType;
  generationRequirement?: {
    prompt: string;
    negativePrompt?: string;
    workflowId: string;
    width: number;
    height: number;
    cachePolicy: CachePolicy;
  };
  resolvedAsset?: EducationalAsset;
  isFromExistingAsset?: boolean;
}

/**
 * Clean output contract destined for the classroom Smart Board.
 */
export interface SmartBoardVisualPayload {
  type: 'visual_requirement';
  visualType: RepresentationType;
  assetUrl?: string;
  title: string;
  purpose: string;
  interaction?: {
    isInteractive: boolean;
    hotspots?: Array<{ id: string; label: string; description: string }>;
    controls?: string[];
  };
  metadata?: Record<string, unknown>;
}

/**
 * Visual Intelligence request payload.
 */
export interface VisualIntelligenceRequest {
  conceptId: string;
  subject?: string;
  topic?: string;
  learningObjective?: string;
  stage?: VisualStage;
  allowGeneration?: boolean;
  cachePolicy?: CachePolicy;
}
