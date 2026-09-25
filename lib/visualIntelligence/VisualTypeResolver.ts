/**
 * Visual Type Resolver (Steps 4, 7, 8)
 *
 * Resolves the optimal pedagogical representation type based on:
 * - Subject and topic semantics
 * - Accuracy level requirements (mathematical/technical concepts demand deterministic structures)
 * - Representation priority hierarchy
 * - Safe fallbacks for unsupported/unimplemented rendering modes
 */

import { RepresentationType, AccuracyLevel, VisualStage } from './types';
import { matchSubjectRule } from './rules/SubjectVisualRules';
import { resolveStageProfile } from './rules/StageVisualRules';

export interface VisualTypeResolution {
  visualType: RepresentationType;
  accuracyLevel: AccuracyLevel;
  fallbackRepresentation: RepresentationType;
  requiresInteraction: boolean;
  requiresLabels: boolean;
  priorityTier: number; // 1 (highest/deterministic) to 6 (lowest/decorative)
  rationale: string;
}

export class VisualTypeResolver {
  /**
   * Resolves the primary representation type and safe fallback.
   */
  public resolve(params: {
    conceptId: string;
    subject?: string;
    topic?: string;
    learningObjective?: string;
    stage?: VisualStage;
  }): VisualTypeResolution {
    const concept = (params.conceptId || '').toLowerCase().trim();
    const topic = (params.topic || '').toLowerCase().trim();
    const objective = (params.learningObjective || '').toLowerCase().trim();
    const stage = params.stage || 'explain';

    // 1. Check Subject-Aware Rules
    const matchedRule = matchSubjectRule(params.subject, `${concept} ${topic} ${objective}`);
    const stageProfile = resolveStageProfile(stage);

    let chosenType: RepresentationType = 'educational_illustration';
    let chosenAccuracy: AccuracyLevel = 'conceptual';
    let requiresInteraction = false;
    let requiresLabels = true;
    let rationale = '';

    if (matchedRule) {
      chosenType = matchedRule.recommendedType;
      chosenAccuracy = matchedRule.accuracyLevel;
      requiresInteraction = matchedRule.requiresInteraction;
      requiresLabels = matchedRule.requiresLabels;
      rationale = `Matched ${matchedRule.subject} visual profile: ${matchedRule.pedagogicalFocus}`;
    } else {
      // General fallbacks based on concept keyword patterns
      if (concept.includes('graph') || concept.includes('plot') || concept.includes('function')) {
        chosenType = 'graph';
        chosenAccuracy = 'mathematical';
        rationale = 'Mathematical curves and functions require coordinate graph representations.';
      } else if (concept.includes('circuit') || concept.includes('motor') || concept.includes('engine')) {
        chosenType = 'scientific_diagram';
        chosenAccuracy = 'technical';
        rationale = 'Electromechanical systems require technical schematic diagrams with labeled components.';
      } else if (concept.includes('timeline') || concept.includes('history') || concept.includes('war')) {
        chosenType = 'timeline';
        chosenAccuracy = 'contextual';
        rationale = 'Chronological events require sequential timeline representations.';
      } else {
        chosenType = 'educational_illustration';
        chosenAccuracy = 'conceptual';
        rationale = 'General curriculum concept suited for structured educational illustration.';
      }
    }

    // 2. Apply Stage Profile Adjustment
    if (stageProfile) {
      if (stageProfile.visualTypeAdjustment) {
        chosenType = stageProfile.visualTypeAdjustment(chosenType);
      }
      requiresInteraction = stageProfile.requiresInteraction;
      rationale += ` Adapted for ${stage} stage: ${stageProfile.pedagogicalModifier}`;
    }

    // 3. Compute Safe Fallback Representation
    const fallback = this.computeFallback(chosenType);

    // 4. Assign Representation Priority Tier (Step 8)
    const priorityTier = this.getPriorityTier(chosenType, chosenAccuracy);

    return {
      visualType: chosenType,
      accuracyLevel: chosenAccuracy,
      fallbackRepresentation: fallback,
      requiresInteraction,
      requiresLabels,
      priorityTier,
      rationale,
    };
  }

  /**
   * Provides guaranteed renderable fallbacks if specific engines/runtimes are not present.
   */
  private computeFallback(type: RepresentationType): RepresentationType {
    switch (type) {
      case 'interactive_simulation':
        return 'scientific_diagram';
      case '3d_model':
      case 'anatomical_visual':
      case 'molecular_visual':
        return 'scientific_diagram';
      case 'graph':
      case 'timeline':
      case 'map':
        return 'educational_illustration';
      case 'code_visual':
      case 'formula_visual':
        return 'scientific_diagram';
      case 'comparison_visual':
      case 'scientific_diagram':
      case 'educational_illustration':
      default:
        return 'educational_illustration';
    }
  }

  /**
   * Evaluates the representation hierarchy (Step 8):
   * 1. Deterministic interactive simulation
   * 2. Deterministic SVG/canvas diagram / graph
   * 3. Verified existing asset
   * 4. Structured 3D asset
   * 5. Generated educational illustration
   * 6. Decorative generated image
   */
  private getPriorityTier(type: RepresentationType, accuracy: AccuracyLevel): number {
    if (type === 'interactive_simulation') return 1;
    if (type === 'graph' || type === 'formula_visual' || accuracy === 'mathematical') return 2;
    if (type === '3d_model' || type === 'molecular_visual' || type === 'anatomical_visual') return 4;
    if (type === 'scientific_diagram') return 5;
    if (accuracy === 'decorative') return 6;
    return 5;
  }
}
