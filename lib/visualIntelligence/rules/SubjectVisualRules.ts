/**
 * Subject-Aware Visual Rules (Step 14)
 *
 * Grounded educational heuristics mapping academic subjects and topics
 * to recommended representation types, accuracy levels, and pedagogical goals.
 */

import { RepresentationType, AccuracyLevel } from '../types';

export interface SubjectRule {
  subject: string;
  topicKeywords: string[];
  recommendedType: RepresentationType;
  accuracyLevel: AccuracyLevel;
  requiresInteraction: boolean;
  requiresLabels: boolean;
  pedagogicalFocus: string;
}

export const SUBJECT_VISUAL_RULES: SubjectRule[] = [
  // ================= MATHEMATICS =================
  {
    subject: 'Mathematics',
    topicKeywords: ['geometry', 'triangle', 'circle', 'polygon', 'angle', 'euclidean', 'perimeter', 'area'],
    recommendedType: 'scientific_diagram',
    accuracyLevel: 'mathematical',
    requiresInteraction: false,
    requiresLabels: true,
    pedagogicalFocus: 'Make geometric theorems and spatial angle relationships directly visible.',
  },
  {
    subject: 'Mathematics',
    topicKeywords: ['coordinate', 'cartesian', 'function', 'quadratic', 'parabola', 'polynomial', 'calculus', 'derivative', 'sine', 'cosine'],
    recommendedType: 'graph',
    accuracyLevel: 'mathematical',
    requiresInteraction: true,
    requiresLabels: true,
    pedagogicalFocus: 'Visualize functional curves, roots, intercepts, and rate of change along coordinate axes.',
  },
  {
    subject: 'Mathematics',
    topicKeywords: ['probability', 'statistics', 'distribution', 'bayes', 'permutation', 'combination', 'dice'],
    recommendedType: 'graph',
    accuracyLevel: 'mathematical',
    requiresInteraction: false,
    requiresLabels: true,
    pedagogicalFocus: 'Display probability density, sample spaces, and frequency distribution bars.',
  },
  {
    subject: 'Mathematics',
    topicKeywords: ['algebra', 'equation', 'formula', 'matrix', 'linear_algebra', 'eigenvalue'],
    recommendedType: 'formula_visual',
    accuracyLevel: 'mathematical',
    requiresInteraction: false,
    requiresLabels: true,
    pedagogicalFocus: 'Structured step-by-step symbolic derivation and variable relationship mapping.',
  },

  // ================= PHYSICS =================
  {
    subject: 'Physics',
    topicKeywords: ['projectile', 'kinematics', 'trajectory', 'gravity', 'velocity', 'acceleration', 'free_fall', 'motion'],
    recommendedType: 'interactive_simulation',
    accuracyLevel: 'scientific',
    requiresInteraction: true,
    requiresLabels: true,
    pedagogicalFocus: 'Decouple orthogonal velocity components and observe parabolic trajectory under gravity.',
  },
  {
    subject: 'Physics',
    topicKeywords: ['motor', 'generator', 'electromagnetism', 'lorentz', 'armature', 'commutator', 'induction', 'faraday', 'magnetic_field'],
    recommendedType: 'scientific_diagram',
    accuracyLevel: 'technical',
    requiresInteraction: true,
    requiresLabels: true,
    pedagogicalFocus: 'Demonstrate vector interaction between magnetic flux lines, loop current, and resulting mechanical torque couple.',
  },
  {
    subject: 'Physics',
    topicKeywords: ['circuit', 'resistor', 'capacitor', 'ohm', 'kirchhoff', 'current', 'voltage', 'schematic'],
    recommendedType: 'scientific_diagram',
    accuracyLevel: 'technical',
    requiresInteraction: false,
    requiresLabels: true,
    pedagogicalFocus: 'Show electrical current paths, nodal potential drops, and component polarities.',
  },
  {
    subject: 'Physics',
    topicKeywords: ['wave', 'optics', 'reflection', 'refraction', 'snell', 'lens', 'interference', 'diffraction'],
    recommendedType: 'scientific_diagram',
    accuracyLevel: 'scientific',
    requiresInteraction: true,
    requiresLabels: true,
    pedagogicalFocus: 'Trace light rays, phase differences, focal lengths, and wavefront interference fringes.',
  },

  // ================= CHEMISTRY =================
  {
    subject: 'Chemistry',
    topicKeywords: ['molecule', 'molecular', 'covalent', 'ionic', 'bond', 'h2o', 'methane', 'lewis', 'vsepr', 'orbital'],
    recommendedType: 'molecular_visual',
    accuracyLevel: 'scientific',
    requiresInteraction: true,
    requiresLabels: true,
    pedagogicalFocus: 'Represent 3D spatial bond angles, valence shell electron pairs, and molecular geometry.',
  },
  {
    subject: 'Chemistry',
    topicKeywords: ['reaction', 'stoichiometry', 'equilibrium', 'catalyst', 'activation_energy', 'kinetics'],
    recommendedType: 'graph',
    accuracyLevel: 'scientific',
    requiresInteraction: false,
    requiresLabels: true,
    pedagogicalFocus: 'Diagram potential energy curves, transition states, and reactant-to-product conversion rates.',
  },
  {
    subject: 'Chemistry',
    topicKeywords: ['periodic', 'atomic', 'electron_configuration', 'isotopes', 'bohr', 'electronegativity'],
    recommendedType: 'scientific_diagram',
    accuracyLevel: 'scientific',
    requiresInteraction: false,
    requiresLabels: true,
    pedagogicalFocus: 'Map concentric electron shells, nuclear charge, and periodic property trends across groups.',
  },

  // ================= BIOLOGY =================
  {
    subject: 'Biology',
    topicKeywords: ['heart', 'cardiac', 'cardiovascular', 'anatomy', 'organ', 'brain', 'lung', 'kidney', 'myocardium'],
    recommendedType: 'anatomical_visual',
    accuracyLevel: 'scientific',
    requiresInteraction: true,
    requiresLabels: true,
    pedagogicalFocus: 'Trace dual-circuit pulmonary and systemic blood flow pathways across internal cardiac chambers and valves.',
  },
  {
    subject: 'Biology',
    topicKeywords: ['cell', 'mitochondria', 'membrane', 'nucleus', 'organelle', 'osmosis', 'photosynthesis', 'respiration'],
    recommendedType: 'educational_illustration',
    accuracyLevel: 'conceptual',
    requiresInteraction: false,
    requiresLabels: true,
    pedagogicalFocus: 'Clarify compartmentalized biochemical pathways and phospholipid bilayer transport mechanisms.',
  },
  {
    subject: 'Biology',
    topicKeywords: ['mitosis', 'meiosis', 'evolution', 'natural_selection', 'dna', 'genetics', 'punnett'],
    recommendedType: 'comparison_visual',
    accuracyLevel: 'conceptual',
    requiresInteraction: false,
    requiresLabels: true,
    pedagogicalFocus: 'Side-by-side contrast of diploid vs haploid division phases or allele combinations.',
  },

  // ================= HISTORY =================
  {
    subject: 'History',
    topicKeywords: ['revolution', 'war', 'timeline', 'dynasty', 'century', 'chronology', 'treaty', 'empire'],
    recommendedType: 'timeline',
    accuracyLevel: 'contextual',
    requiresInteraction: false,
    requiresLabels: true,
    pedagogicalFocus: 'Establish causal and chronological sequences of pivotal historical turning points.',
  },
  {
    subject: 'History',
    topicKeywords: ['conquest', 'migration', 'silk_road', 'geography', 'territory', 'battle', 'boundary', 'map'],
    recommendedType: 'map',
    accuracyLevel: 'contextual',
    requiresInteraction: false,
    requiresLabels: true,
    pedagogicalFocus: 'Illustrate geopolitical borders, trade expeditions, and territorial expansion over time.',
  },
  {
    subject: 'History',
    topicKeywords: ['civilization', 'artifact', 'culture', 'monument', 'renaissance', 'industrial'],
    recommendedType: 'educational_illustration',
    accuracyLevel: 'contextual',
    requiresInteraction: false,
    requiresLabels: false,
    pedagogicalFocus: 'Provide grounded architectural and atmospheric context of historical eras without mythologizing.',
  },

  // ================= PROGRAMMING =================
  {
    subject: 'Computer Science',
    topicKeywords: ['algorithm', 'code', 'sorting', 'recursion', 'binary_search', 'debugging', 'python', 'javascript', 'loop'],
    recommendedType: 'code_visual',
    accuracyLevel: 'technical',
    requiresInteraction: true,
    requiresLabels: true,
    pedagogicalFocus: 'Highlight active stack frames, variable state transitions, and step-by-step pointer positions.',
  },
  {
    subject: 'Computer Science',
    topicKeywords: ['data_structure', 'tree', 'binary_tree', 'graph_traversal', 'linked_list', 'stack', 'queue'],
    recommendedType: 'scientific_diagram',
    accuracyLevel: 'technical',
    requiresInteraction: true,
    requiresLabels: true,
    pedagogicalFocus: 'Visualize memory node connections, pointer dereferencing, and tree balancing invariants.',
  },

  // ================= DATA SCIENCE =================
  {
    subject: 'Data Science',
    topicKeywords: ['regression', 'correlation', 'scatter', 'cluster', 'kmeans', 'outlier', 'variance', 'dataset'],
    recommendedType: 'graph',
    accuracyLevel: 'mathematical',
    requiresInteraction: true,
    requiresLabels: true,
    pedagogicalFocus: 'Plot multi-dimensional feature scatter, regression decision boundaries, and cluster centroids.',
  },

  // ================= ENGLISH / LANGUAGE =================
  {
    subject: 'English',
    topicKeywords: ['dialogue', 'scene', 'idiom', 'setting', 'story', 'literature', 'metaphor'],
    recommendedType: 'educational_illustration',
    accuracyLevel: 'contextual',
    requiresInteraction: false,
    requiresLabels: false,
    pedagogicalFocus: 'Establish evocative scene setting or cultural situational context for conversational immersion.',
  },
];

/**
 * Finds matching subject rules based on subject and topic keywords.
 */
export function matchSubjectRule(subject?: string, topicOrConcept?: string): SubjectRule | null {
  const normSubject = (subject || '').toLowerCase().trim();
  const normTopic = (topicOrConcept || '').toLowerCase().trim();

  // 1. Direct topic keyword matching across all subjects
  for (const rule of SUBJECT_VISUAL_RULES) {
    if (normSubject && rule.subject.toLowerCase() === normSubject) {
      for (const kw of rule.topicKeywords) {
        if (normTopic.includes(kw)) {
          return rule;
        }
      }
    }
  }

  // 2. Global keyword match if subject is unspecified or mismatched
  for (const rule of SUBJECT_VISUAL_RULES) {
    for (const kw of rule.topicKeywords) {
      if (normTopic.includes(kw)) {
        return rule;
      }
    }
  }

  // 3. Subject fallback default
  if (normSubject) {
    const defaultForSubject = SUBJECT_VISUAL_RULES.find(
      (r) => r.subject.toLowerCase() === normSubject
    );
    if (defaultForSubject) return defaultForSubject;
  }

  return null;
}
