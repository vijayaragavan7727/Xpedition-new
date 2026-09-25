/**
 * Stage-Aware Visual Rules (Step 16)
 *
 * Grounded heuristics adapting representation demands based on the active pedagogical stage:
 * - INTRODUCE: Simple high-level labeled visual or real-world hook
 * - EXPLAIN: Comprehensive scientific diagram / mechanistic detail
 * - DEMONSTRATE: Step-by-step procedural or physical walkthrough
 * - INTERACT: Active parameter manipulation or physics simulation
 * - QUESTION: Simplified stimulus highlighting key query elements
 * - PRACTICE: Scaffolded diagram with contextual hints
 * - CHALLENGE: Diagnostic edge-case or anomaly scenario
 * - ASSESS: Unassisted formal evaluation visual
 * - FEEDBACK: Remedial focus on misunderstood relationships
 */

import { VisualStage, RepresentationType } from '../types';

export interface StageVisualProfile {
  stage: VisualStage;
  preferredComplexity: 'simple' | 'comprehensive' | 'interactive' | 'diagnostic';
  visualTypeAdjustment?: (baseType: RepresentationType) => RepresentationType;
  requiresInteraction: boolean;
  pedagogicalModifier: string;
}

export const STAGE_VISUAL_RULES: Record<VisualStage, StageVisualProfile> = {
  introduce: {
    stage: 'introduce',
    preferredComplexity: 'simple',
    visualTypeAdjustment: (baseType) => {
      // In introduction, favor clean illustrations or overall diagrams
      if (baseType === 'interactive_simulation') return 'scientific_diagram';
      return baseType;
    },
    requiresInteraction: false,
    pedagogicalModifier: 'Provide a clean, inviting overall conceptual overview without overwhelming visual clutter.',
  },
  explain: {
    stage: 'explain',
    preferredComplexity: 'comprehensive',
    visualTypeAdjustment: (baseType) => baseType,
    requiresInteraction: false,
    requiresLabels: true,
    pedagogicalModifier: 'Detail underlying physical/mathematical mechanics with clearly visible force vectors and component labels.',
  } as StageVisualProfile,
  demonstrate: {
    stage: 'demonstrate',
    preferredComplexity: 'comprehensive',
    visualTypeAdjustment: (baseType) => baseType,
    requiresInteraction: false,
    requiresLabels: true,
    pedagogicalModifier: 'Walk through dynamic operational transitions sequentially.',
  } as StageVisualProfile,
  interact: {
    stage: 'interact',
    preferredComplexity: 'interactive',
    visualTypeAdjustment: (baseType) => {
      if (baseType === 'scientific_diagram' || baseType === 'educational_illustration') {
        return 'interactive_simulation';
      }
      return baseType;
    },
    requiresInteraction: true,
    pedagogicalModifier: 'Empower student with direct parameter sliders, angle adjustments, or interactive hotspot exploration.',
  },
  question: {
    stage: 'question',
    preferredComplexity: 'simple',
    visualTypeAdjustment: (baseType) => {
      if (baseType === 'interactive_simulation') return 'scientific_diagram';
      return baseType;
    },
    requiresInteraction: false,
    pedagogicalModifier: 'Isolate queried elements distinctly to anchor multiple-choice and conceptual assessment.',
  },
  practice: {
    stage: 'practice',
    preferredComplexity: 'comprehensive',
    visualTypeAdjustment: (baseType) => baseType,
    requiresInteraction: true,
    pedagogicalModifier: 'Scaffold problem-solving steps with contextual formula references.',
  },
  challenge: {
    stage: 'challenge',
    preferredComplexity: 'diagnostic',
    visualTypeAdjustment: (baseType) => baseType,
    requiresInteraction: true,
    pedagogicalModifier: 'Present diagnostic counter-examples, inverted polarities, or edge-case boundary conditions.',
  },
  assess: {
    stage: 'assess',
    preferredComplexity: 'simple',
    visualTypeAdjustment: (baseType) => baseType,
    requiresInteraction: false,
    pedagogicalModifier: 'Neutral, clean visual stimulus without revealing solution annotations directly.',
  },
  feedback: {
    stage: 'feedback',
    preferredComplexity: 'simple',
    visualTypeAdjustment: (baseType) => baseType,
    requiresInteraction: false,
    pedagogicalModifier: 'Call out and clarify common misconceptions or missed vector interactions.',
  },
};

/**
 * Resolves the stage profile for a given visual stage.
 */
export function resolveStageProfile(stage?: VisualStage): StageVisualProfile {
  if (!stage || !STAGE_VISUAL_RULES[stage]) {
    return STAGE_VISUAL_RULES.explain;
  }
  return STAGE_VISUAL_RULES[stage];
}
