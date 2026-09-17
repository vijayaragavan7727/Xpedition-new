/**
 * Xpedition Visual Teaching Mode Engine v1 — Teaching Mode Selector
 *
 * Deterministically chooses the canonical visual teaching mode based on:
 * - Topic domain, semantic markers, and pedagogical requirements
 * - Spatial requirements vs. process vs. variable manipulation vs. transformation
 * - Device capabilities (WebGL support, reduced motion, low power)
 *
 * Rules:
 * - Minimum interaction, maximum understanding (~30s to 2min target)
 * - Deterministic scoring; NO unrestricted LLM authority
 */

import {
  TeachingMode,
  DeviceCapabilities,
  TeachingModeSelectionResult,
} from './types';

export interface TopicSelectionContext {
  normalizedTopic: string;
  subject?: string;
  domain?: string;
  hasCurated3DExperience?: boolean;
  isSpecializedExperience?: boolean;
  keyPrinciples?: string[];
}

export class TeachingModeSelector {
  /**
   * Evaluates a topic and environment context to choose the canonical teaching mode.
   */
  static selectMode(
    topicContext: TopicSelectionContext,
    deviceCapabilities: DeviceCapabilities = { hasWebGL: true, prefersReducedMotion: false }
  ): TeachingModeSelectionResult {
    const raw = (topicContext.normalizedTopic || '').toLowerCase();

    // 1. Accessibility & Hardware Constraints Overrides
    if (!deviceCapabilities.hasWebGL) {
      // Cannot run FULL_3D without WebGL
      return {
        primaryMode: 'INTERACTIVE_VISUAL',
        secondaryMode: '2D_FALLBACK',
        rationale: 'WebGL hardware acceleration is unavailable. Fallback to lightweight interactive visual.',
        fallbackReason: 'NO_WEBGL_SUPPORT',
        confidence: 0.95,
      };
    }

    if (deviceCapabilities.prefersReducedMotion) {
      // Prefer interactive parameter control or structured 2D over continuous animation
      if (raw.includes('photosynthesis') || raw.includes('dna') || raw.includes('sort')) {
        return {
          primaryMode: 'INTERACTIVE_VISUAL',
          secondaryMode: '2D_FALLBACK',
          rationale: 'User prefers reduced motion. Using step-controlled interactive visual representation.',
          fallbackReason: 'PREFERS_REDUCED_MOTION',
          confidence: 0.9,
        };
      }
    }

    // 2. Specialized Canonical 3D Experiences (Preserve Existing Canonical 3D)
    if (
      raw.includes('heart') ||
      raw.includes('cardiac') ||
      raw.includes('solar system') ||
      raw.includes('planet') ||
      raw.includes('polyhedron') ||
      raw.includes('spatial reasoning')
    ) {
      return {
        primaryMode: 'FULL_3D',
        secondaryMode: 'INTERACTIVE_VISUAL',
        rationale: 'Spatial exploration and 3D organ/orbital perspective materially improve understanding.',
        recommendedControls: ['camera_rotation', 'slice_plane'],
        confidence: 0.98,
      };
    }

    if (raw.includes('projectile') || raw.includes('trajectory')) {
      return {
        primaryMode: 'FULL_3D',
        secondaryMode: 'INTERACTIVE_VISUAL',
        rationale: '3D trajectory physics combined with launch angle and velocity control.',
        recommendedControls: ['launch_angle', 'initial_velocity'],
        confidence: 0.98,
      };
    }

    // 3. Exploded Visual (Complex assemblies with separated interacting parts)
    if (
      raw.includes('electric motor') ||
      raw.includes('dc motor') ||
      raw.includes('motor') ||
      raw.includes('commutator') ||
      raw.includes('armature') ||
      raw.includes('internal combustion') ||
      raw.includes('gearbox')
    ) {
      return {
        primaryMode: 'EXPLODED_VISUAL',
        secondaryMode: 'INTERACTIVE_VISUAL',
        rationale: 'Understanding parts (magnets, coil, commutator, brushes) and spatial assembly is vital.',
        recommendedControls: ['assembly_separation', 'current_direction'],
        confidence: 0.95,
      };
    }

    // 4. Transformation Visual (State A -> Transition -> State B)
    if (
      raw.includes('dna replication') ||
      raw.includes('dna') ||
      raw.includes('mitosis') ||
      raw.includes('cell division') ||
      raw.includes('water cycle') ||
      raw.includes('evaporation') ||
      raw.includes('phase change')
    ) {
      return {
        primaryMode: 'TRANSFORMATION_VISUAL',
        secondaryMode: 'MOTION_VISUAL',
        rationale: 'The concept is fundamentally a structural state transition from initial state to transformed state.',
        recommendedControls: ['transformation_step', 'catalyst_trigger'],
        confidence: 0.94,
      };
    }

    // 5. Motion Visual (Sequential dynamic processes without complex manipulation)
    if (
      raw.includes('photosynthesis') ||
      raw.includes('calvin cycle') ||
      raw.includes('chloroplast') ||
      raw.includes('krebs') ||
      raw.includes('respiration')
    ) {
      return {
        primaryMode: 'MOTION_VISUAL',
        secondaryMode: 'INTERACTIVE_VISUAL',
        rationale: 'Biological process is best understood as a progressive sequence of inputs and outputs.',
        recommendedControls: ['play_pause', 'stage_scrubber'],
        confidence: 0.95,
      };
    }

    // 6. Interactive Visual (1-2 Parameter Demonstrations)
    if (
      raw.includes('newton') ||
      raw.includes('force') ||
      raw.includes('f = ma') ||
      raw.includes('acceleration') ||
      raw.includes('circuit') ||
      raw.includes('ohm') ||
      raw.includes('resistor') ||
      raw.includes('fraction') ||
      raw.includes('numerator') ||
      raw.includes('supply and demand') ||
      raw.includes('supply & demand') ||
      (raw.includes('supply') && raw.includes('demand')) ||
      raw.includes('market equilibrium') ||
      raw.includes('price elasticity') ||
      raw.includes('gravity') ||
      raw.includes('pendulum')
    ) {
      return {
        primaryMode: 'INTERACTIVE_VISUAL',
        secondaryMode: 'MOTION_VISUAL',
        rationale: 'Direct manipulation of 1-2 governing variables provides immediate visual cause-and-effect understanding.',
        recommendedControls: ['primary_parameter', 'secondary_parameter'],
        confidence: 0.95,
      };
    }

    // 7. Sorting Algorithms (Motion sequence + optional step comparison)
    if (raw.includes('sorting') || raw.includes('bubble sort') || raw.includes('quicksort') || raw.includes('merge sort')) {
      return {
        primaryMode: 'MOTION_VISUAL',
        secondaryMode: 'INTERACTIVE_VISUAL',
        rationale: 'Visualizing element comparisons and swaps across array stages illuminates algorithmic efficiency.',
        recommendedControls: ['step_forward', 'array_size'],
        confidence: 0.92,
      };
    }

    // 8. Abstract, Linguistic, Economic, or Novel Topics -> 2D Fallback / Interactive Visual
    if (
      raw.includes('grammar') ||
      raw.includes('syntax') ||
      raw.includes('sentence') ||
      raw.includes('verb') ||
      raw.includes('noun') ||
      raw.includes('english')
    ) {
      return {
        primaryMode: 'INTERACTIVE_VISUAL',
        secondaryMode: '2D_FALLBACK',
        rationale: 'Interactive clause and part-of-speech visual mapping with dynamic highlights.',
        recommendedControls: ['clause_selector'],
        confidence: 0.9,
      };
    }

    if (
      raw.includes('inflation') ||
      raw.includes('money supply') ||
      raw.includes('purchasing power') ||
      raw.includes('quantum wave') ||
      raw.includes('wave function') ||
      topicContext.subject === 'History' ||
      topicContext.subject === 'Interdisciplinary'
    ) {
      return {
        primaryMode: '2D_FALLBACK',
        secondaryMode: 'INTERACTIVE_VISUAL',
        rationale: 'Abstract or theoretical concept best illuminated with high-clarity relational node network.',
        confidence: 0.9,
      };
    }

    // 9. Generic Fallback Deterministic Rule
    return {
      primaryMode: '2D_FALLBACK',
      secondaryMode: 'INTERACTIVE_VISUAL',
      rationale: 'Novel or generalized topic mapped to clear concept node network and verifiable principles.',
      confidence: 0.85,
    };
  }
}
