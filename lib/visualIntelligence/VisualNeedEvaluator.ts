/**
 * Visual Need Evaluator (Step 3, 13, 15, 20)
 *
 * Deterministic pedagogical evaluator determining whether a concept
 * genuinely benefits from visual representation or would produce visual clutter.
 */

import { VisualNeedResult } from './types';

export interface IVisualNeedEvaluator {
  evaluate(params: {
    conceptId: string;
    subject?: string;
    topic?: string;
    learningObjective?: string;
  }): Promise<VisualNeedResult> | VisualNeedResult;
}

/**
 * Keyword patterns indicating concepts where text alone is insufficient
 * and spatial, physical, or geometric visualization accelerates comprehension.
 */
const HIGH_VISUAL_KEYWORDS = [
  // Physics / Engineering mechanisms
  'motor', 'commutator', 'armature', 'lorentz', 'trajectory', 'projectile', 'kinematic',
  'circuit', 'schematic', 'vector', 'torque', 'magnetic_field', 'flux', 'optics', 'refraction',
  // Geometry & Math graphs
  'geometry', 'triangle', 'parabola', 'quadratic', 'coordinate', 'graph', 'polygon', 'curve',
  // Chemistry structures
  'molecule', 'bond', 'covalent', 'ionic', 'orbital', 'vsepr', 'lewis',
  // Biology anatomy
  'anatomy', 'heart', 'organ', 'chamber', 'ventricle', 'valve', 'cell', 'membrane', 'mitosis',
  // Algorithms / Data structures
  'tree', 'binary_tree', 'graph_traversal', 'pointer', 'sorting_animation',
  // History spatial/temporal
  'timeline', 'map', 'territory', 'chronology'
];

/**
 * Keyword patterns indicating purely definitional, vocabulary, or factual statements
 * where an image is unneeded or would be purely decorative noise.
 */
const LOW_VISUAL_KEYWORDS = [
  'define', 'definition', 'vocabulary', 'spelling', 'synonym', 'antonym',
  'etymology', 'factual_date', 'year_of', 'recite', 'memorize_name',
  'simple_statement', 'grammar_rule', 'pronunciation'
];

export class RuleBasedVisualNeedEvaluator implements IVisualNeedEvaluator {
  public evaluate(params: {
    conceptId: string;
    subject?: string;
    topic?: string;
    learningObjective?: string;
  }): VisualNeedResult {
    const concept = (params.conceptId || '').toLowerCase().trim();
    const topic = (params.topic || '').toLowerCase().trim();
    const objective = (params.learningObjective || '').toLowerCase().trim();
    const combined = `${concept} ${topic} ${objective}`;

    // 1. Check for explicit low-visual keywords (definitions, vocabulary, trivia)
    const lowMatch = LOW_VISUAL_KEYWORDS.find((kw) => combined.includes(kw));
    if (lowMatch) {
      // If it's a pure definition without a spatial mechanism
      const hasSpatialOverride = HIGH_VISUAL_KEYWORDS.some((kw) => combined.includes(kw));
      if (!hasSpatialOverride) {
        return {
          needed: false,
          confidence: 0.88,
          reason: `The concept focuses on verbal definition or vocabulary ('${lowMatch}'). Textual and dialogue scaffolding provides clearer comprehension without visual distraction.`,
        };
      }
    }

    // 2. Check for high-visual spatial/physical/structural concepts
    const highMatches = HIGH_VISUAL_KEYWORDS.filter((kw) => combined.includes(kw));
    if (highMatches.length > 0) {
      const matchDescriptions = highMatches.slice(0, 3).join(', ');
      return {
        needed: true,
        confidence: Math.min(0.96, 0.82 + highMatches.length * 0.05),
        reason: `Concept involves spatial relationships, component interactions, or geometric vectors (${matchDescriptions}) that are difficult to grasp from text alone.`,
      };
    }

    // 3. Subject-based heuristics for ambiguous concepts
    const subject = (params.subject || '').toLowerCase().trim();
    if (subject === 'mathematics' || subject === 'physics' || subject === 'chemistry') {
      return {
        needed: true,
        confidence: 0.80,
        reason: `${params.subject} concepts typically rely on visual diagrams, graphs, or schematics to ground quantitative reasoning.`,
      };
    }

    if (subject === 'biology' || subject === 'anatomy') {
      return {
        needed: true,
        confidence: 0.85,
        reason: `Biological processes and structural anatomy benefit significantly from spatial visual reinforcement.`,
      };
    }

    if (subject === 'history') {
      return {
        needed: true,
        confidence: 0.72,
        reason: `Historical concepts benefit from contextual timelines or maps to ground chronological and geographic sequence.`,
      };
    }

    if (subject === 'english' || subject === 'language') {
      return {
        needed: false,
        confidence: 0.75,
        reason: `Language and conversational tasks prioritize dialogue flow and reading comprehension; visual representations are optional.`,
      };
    }

    // 4. Fallback default: cautious neutral need
    return {
      needed: true,
      confidence: 0.65,
      reason: `Moderate visual utility: a structured educational visual can support conceptual anchor points.`,
    };
  }
}
