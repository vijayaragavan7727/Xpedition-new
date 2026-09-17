/**
 * Xpedition Universal Teaching Engine v1 — Topic Resolver
 *
 * Decomposes any learning topic into an authoritative UniversalLearningTopic.
 * Guarantees 100% deterministic resolution with zero AI dependency required.
 */

import {
  UniversalLearningTopic,
  SubjectCategory,
  UniversalExperienceFamily,
  VisualRepresentationMode,
  FallbackExperienceType,
  SourceGroundingType,
  TeachingMode,
} from './universalTopicTypes';
import { ExperienceType } from './types';
import { KnowledgeBundleService } from '../intelligence/sources';
import { TeachingModeSelector } from './visualTeaching/teachingModeSelector';

export interface TopicResolverOptions {
  subject?: string;
  learnerState?: any;
  goal?: string;
  difficulty?: number;
}

interface CuratedTopicTemplate {
  normalizedKeys: string[];
  subject: SubjectCategory;
  domain: string;
  conceptIds: string[];
  prerequisites: string[];
  learningObjectives: string[];
  difficulty: number;
  recommendedExperienceType: UniversalExperienceFamily | ExperienceType;
  visualRepresentation: VisualRepresentationMode;
  fallbackExperience: FallbackExperienceType;
  keyPrinciples: string[];
  specializedExperienceId?: string;
}

const CURATED_TOPICS: CuratedTopicTemplate[] = [
  // 1. CANONICAL EXISTING SPECIALIZED EXPERIENCES
  {
    normalizedKeys: ['projectile motion', 'projectile', 'trajectory', 'launch angle', 'parabolic motion'],
    subject: 'Physics',
    domain: 'Classical Kinematics',
    conceptIds: ['projectile_motion'],
    prerequisites: ['vectors', 'basic_kinematics'],
    learningObjectives: [
      'Understand how launch angle and initial velocity determine horizontal range and peak height.',
      'Recognize that horizontal velocity remains constant in ideal projectile motion.',
      'Predict the optimal 45° angle for maximizing distance on level ground.',
    ],
    difficulty: 0.45,
    recommendedExperienceType: 'PROJECTILE_SIMULATION',
    visualRepresentation: 'interactive_simulation',
    fallbackExperience: 'interactive_diagram',
    keyPrinciples: ['Independent Horizontal & Vertical Motion', 'Constant Gravitational Acceleration', 'Optimal 45° Launch Angle'],
    specializedExperienceId: 'PROJECTILE_SIMULATION',
  },
  {
    normalizedKeys: ['spatial reasoning', '3d object', 'cube rotation', 'polyhedron', 'spatial alignment'],
    subject: 'Mathematics',
    domain: 'Spatial & Solid Geometry',
    conceptIds: ['spatial_reasoning'],
    prerequisites: ['3d_axes', 'rotational_angles'],
    learningObjectives: [
      'Mentally rotate 3D polyhedra to match a target spatial orientation.',
      'Isolate roll, pitch, and yaw rotation axes to solve alignment puzzles efficiently.',
    ],
    difficulty: 0.5,
    recommendedExperienceType: 'OBJECT_MANIPULATION',
    visualRepresentation: '3d_scene',
    fallbackExperience: 'structured_visual',
    keyPrinciples: ['Euler Angle Rotations', 'Axis Isolation', 'Symmetry & Perspective'],
    specializedExperienceId: 'OBJECT_MANIPULATION',
  },
  {
    normalizedKeys: ['molecular bonding', 'chemical bonding', 'valence electrons', 'covalent bond', 'molecule builder'],
    subject: 'Chemistry',
    domain: 'Molecular Structure & Bonding',
    conceptIds: ['molecular_bonding'],
    prerequisites: ['atomic_structure', 'periodic_table_valence'],
    learningObjectives: [
      'Satisfy the octet rule by constructing covalent bonds between atoms.',
      'Distinguish between hydrogen (1 bond), oxygen (2 bonds), and carbon (4 bonds).',
      'Verify valid molecular stability and geometry.',
    ],
    difficulty: 0.55,
    recommendedExperienceType: 'MOLECULE_BUILDER',
    visualRepresentation: '3d_scene',
    fallbackExperience: 'interactive_diagram',
    keyPrinciples: ['Octet Rule & Valence Saturation', 'Covalent Bond Sharing', '3D Molecular Geometry'],
    specializedExperienceId: 'MOLECULE_BUILDER',
  },
  {
    normalizedKeys: ['human heart', 'heart anatomy', 'cardiac', 'blood flow', 'heart chambers', 'valves'],
    subject: 'Biology',
    domain: 'Cardiovascular Physiology',
    conceptIds: ['human_heart_anatomy'],
    prerequisites: ['organ_systems', 'circulatory_overview'],
    learningObjectives: [
      'Trace deoxygenated blood through the vena cava, right atrium, tricuspid valve, and right ventricle.',
      'Identify pulmonary circulation to the lungs and systemic oxygenated flow to the aorta.',
      'Understand how one-way valves prevent backflow under pressure.',
    ],
    difficulty: 0.6,
    recommendedExperienceType: 'HEART_ANATOMY_EXPLORER',
    visualRepresentation: '3d_scene',
    fallbackExperience: 'interactive_diagram',
    keyPrinciples: ['12-Step Cardiovascular Blood Flow', 'Chamber & Valve Mechanics', 'Oxygenation Transition'],
    specializedExperienceId: 'HEART_ANATOMY_EXPLORER',
  },
  {
    normalizedKeys: ['python debugging', 'code debugging', 'loop accumulation', 'python loops', 'variable reassignment'],
    subject: 'Computer Science',
    domain: 'Programming & Algorithmic Debugging',
    conceptIds: ['python_debugging_basics'],
    prerequisites: ['python_syntax', 'for_loops'],
    learningObjectives: [
      'Identify the critical distinction between reassignment (=) and accumulation (+=) inside loops.',
      'Trace loop variable state iteration by iteration to predict output.',
      'Correct logical bugs independently without breaking control flow.',
    ],
    difficulty: 0.35,
    recommendedExperienceType: 'CODE_DEBUGGING',
    visualRepresentation: 'interactive_simulation',
    fallbackExperience: 'practice_challenge',
    keyPrinciples: ['Loop Accumulation vs Reassignment', 'Deterministic AST Execution', 'State Tracking Across Iterations'],
    specializedExperienceId: 'CODE_DEBUGGING',
  },

  // 2. CURATED UNIVERSAL 3D TEACHING PROOFS
  {
    normalizedKeys: ["newton's laws", 'newtons laws', 'newton second law', 'force and motion', 'f = ma', 'inertia', 'acceleration'],
    subject: 'Physics',
    domain: 'Classical Dynamics',
    conceptIds: ['newtons_laws_motion'],
    prerequisites: ['speed_velocity', 'force_concept'],
    learningObjectives: [
      'Understand that net force produces proportional acceleration (F = ma).',
      'Observe how doubling mass reduces acceleration by half for the same force.',
      'Predict how opposing friction modifies net acceleration.',
    ],
    difficulty: 0.4,
    recommendedExperienceType: 'SIMULATION',
    visualRepresentation: '3d_scene',
    fallbackExperience: 'interactive_diagram',
    keyPrinciples: ['Newton’s 1st Law (Inertia)', 'Newton’s 2nd Law (F = ma)', 'Opposing Friction Vectors'],
  },
  {
    normalizedKeys: ['photosynthesis', 'chloroplast', 'calvin cycle', 'light reactions', 'plant energy', 'stomata'],
    subject: 'Biology',
    domain: 'Plant Physiology & Bioenergetics',
    conceptIds: ['photosynthesis_chloroplast'],
    prerequisites: ['plant_cell_basics', 'molecules_of_life'],
    learningObjectives: [
      'Trace the biochemical inputs (light, CO₂, H₂O) and outputs (glucose, O₂) of photosynthesis.',
      'Observe how changing light intensity limits glucose production.',
      'Understand the role of chloroplasts in capturing solar photons.',
    ],
    difficulty: 0.45,
    recommendedExperienceType: 'EXPLORER',
    visualRepresentation: '3d_scene',
    fallbackExperience: 'interactive_diagram',
    keyPrinciples: ['Light-Dependent Reactions', 'Calvin Cycle Carbon Fixation', 'Substrate Limitation Dynamics'],
  },
  {
    normalizedKeys: ['electric circuits', 'circuits', "ohm's law", 'ohms law', 'resistor', 'voltage and current', 'breadboard'],
    subject: 'Physics',
    domain: 'Electromagnetism & Circuits',
    conceptIds: ['electric_circuits_ohms_law'],
    prerequisites: ['electric_charge', 'conductors_insulators'],
    learningObjectives: [
      'Understand Ohm’s Law relationship: Current is directly proportional to Voltage and inversely to Resistance (I = V / R).',
      'Observe how an open switch creates infinite resistance, stopping current flow.',
      'Predict bulb brightness based on power dissipation (P = I²R).',
    ],
    difficulty: 0.45,
    recommendedExperienceType: 'SIMULATION',
    visualRepresentation: '3d_scene',
    fallbackExperience: 'interactive_diagram',
    keyPrinciples: ['Closed Loop Circuit Requirement', 'Ohm’s Law (V = IR)', 'Power Dissipation & Glow'],
  },
  {
    normalizedKeys: ['electric motor', 'dc motor', 'motor', 'lorentz force', 'commutator', 'armature'],
    subject: 'Physics',
    domain: 'Electromagnetism',
    conceptIds: ['electric_motor'],
    prerequisites: ['magnetic_fields', 'electric_current', 'lorentz_force'],
    learningObjectives: [
      'Understand how Lorentz force (F = I·L × B) produces rotational torque on a current-carrying loop.',
      'Explain the vital function of the split-ring commutator in reversing current to sustain continuous rotation.',
      'Predict the effect of changing electric current and magnetic field strength on motor torque and speed.',
    ],
    difficulty: 0.55,
    recommendedExperienceType: 'SIMULATION',
    visualRepresentation: '3d_scene',
    fallbackExperience: 'interactive_diagram',
    keyPrinciples: [
      'Lorentz Force on Current Carriers: F = I(L × B)',
      'Split-Ring Commutation: Polarity Inversion Every 180°',
      'Electromagnetic Torque Couple: τ = 2 × F × r',
      'Counter-Electromotive Force (Back-EMF)',
    ],
  },
  {
    normalizedKeys: ['solar system', 'planets', 'planetary orbits', 'kepler laws', 'orbital mechanics', 'sun and planets'],
    subject: 'Astronomy',
    domain: 'Celestial Mechanics',
    conceptIds: ['solar_system_orbits'],
    prerequisites: ['gravity_basics', 'circles_ellipses'],
    learningObjectives: [
      'Demonstrate that planets closer to the Sun orbit faster than outer planets (Kepler’s 3rd Law: T² ∝ a³).',
      'Compare orbital distances (AU) and periods between Mercury, Earth, and Jupiter.',
      'Understand the Sun as the central gravitational mass anchoring all orbits.',
    ],
    difficulty: 0.4,
    recommendedExperienceType: 'EXPLORER',
    visualRepresentation: '3d_scene',
    fallbackExperience: 'interactive_diagram',
    keyPrinciples: ['Kepler’s Laws of Planetary Motion', 'Gravitational Central Force', 'Orbital Period vs Semi-Major Axis'],
  },
  {
    normalizedKeys: ['fractions', 'fraction', 'numerator denominator', 'equivalent fractions', 'parts of a whole', 'dividing fractions'],
    subject: 'Mathematics',
    domain: 'Elementary Arithmetic & Rational Numbers',
    conceptIds: ['fractions_rational_parts'],
    prerequisites: ['whole_number_division', 'number_line'],
    learningObjectives: [
      'Recognize the denominator as the total number of equal parts and the numerator as the selected parts.',
      'Visually prove that 3/4 and 6/8 represent the exact same proportion of a whole.',
      'Map fractional quantities along a continuous 0 to 1 number line.',
    ],
    difficulty: 0.3,
    recommendedExperienceType: 'INTERACTIVE_DIAGRAM',
    visualRepresentation: '3d_scene',
    fallbackExperience: 'structured_visual',
    keyPrinciples: ['Partitioning of Equal Wholes', 'Fraction Equivalence', 'Number Line Continuum'],
  },

  // 3. ADDITIONAL POPULAR CURATED TOPICS
  {
    normalizedKeys: ['dna replication', 'dna', 'double helix', 'nucleotides', 'base pairing', 'rna'],
    subject: 'Biology',
    domain: 'Molecular Genetics',
    conceptIds: ['dna_replication_mechanics'],
    prerequisites: ['cell_nucleus', 'macromolecules'],
    learningObjectives: [
      'Understand complementary base pairing: Adenine with Thymine (A-T) and Cytosine with Guanine (C-G).',
      'Observe DNA helicase unwinding the double helix during replication.',
    ],
    difficulty: 0.6,
    recommendedExperienceType: 'BUILDER',
    visualRepresentation: '3d_scene',
    fallbackExperience: 'interactive_diagram',
    keyPrinciples: ['Complementary Base Pairing (A-T, C-G)', 'Semi-Conservative Replication', 'Helicase Unwinding'],
  },
  {
    normalizedKeys: ['sorting algorithms', 'sorting', 'bubble sort', 'quicksort', 'merge sort', 'binary search'],
    subject: 'Computer Science',
    domain: 'Algorithms & Data Structures',
    conceptIds: ['sorting_algorithms_visual'],
    prerequisites: ['arrays', 'comparison_operators'],
    learningObjectives: [
      'Trace comparative sorting element by element across an array.',
      'Understand time complexity tradeoffs between O(n²) and O(n log n).',
    ],
    difficulty: 0.55,
    recommendedExperienceType: 'CODE_LAB',
    visualRepresentation: 'interactive_simulation',
    fallbackExperience: 'practice_challenge',
    keyPrinciples: ['Comparative Swapping', 'Partitioning & Recursion', 'Asymptotic Complexity'],
  },
  {
    normalizedKeys: ['binary trees', 'binary tree', 'tree traversal', 'bst', 'binary search tree'],
    subject: 'Computer Science',
    domain: 'Data Structures',
    conceptIds: ['binary_trees_traversal'],
    prerequisites: ['pointers_references', 'nodes'],
    learningObjectives: [
      'Understand root, parent, left child, and right child relationships in hierarchical data.',
      'Verify that for any node in a BST, left children are smaller and right children are larger.',
    ],
    difficulty: 0.6,
    recommendedExperienceType: 'BUILDER',
    visualRepresentation: '3d_scene',
    fallbackExperience: 'interactive_diagram',
    keyPrinciples: ['Hierarchical Node Pointers', 'BST Ordering Invariant', 'In-Order Traversal'],
  },
  {
    normalizedKeys: ['probability', 'odds', 'coin flip', 'dice', 'bayes theorem', 'independent events'],
    subject: 'Mathematics',
    domain: 'Probability & Statistics',
    conceptIds: ['probability_foundations'],
    prerequisites: ['fractions_decimals', 'sample_space'],
    learningObjectives: [
      'Calculate theoretical probability as favorable outcomes over total possible outcomes.',
      'Observe how empirical results converge toward theoretical probability as trials increase (Law of Large Numbers).',
    ],
    difficulty: 0.45,
    recommendedExperienceType: 'SIMULATION',
    visualRepresentation: 'interactive_simulation',
    fallbackExperience: 'interactive_diagram',
    keyPrinciples: ['Sample Space Definition', 'Law of Large Numbers', 'Conditional Independence'],
  },
  {
    normalizedKeys: ['supply and demand', 'economics', 'market equilibrium', 'price elasticity', 'market forces'],
    subject: 'Economics',
    domain: 'Microeconomics',
    conceptIds: ['supply_demand_equilibrium'],
    prerequisites: ['graphs_slopes', 'basic_trade'],
    learningObjectives: [
      'Understand how the intersection of downward-sloping demand and upward-sloping supply establishes market equilibrium price.',
      'Observe how shifts in supply or demand curves affect equilibrium price and quantity.',
    ],
    difficulty: 0.5,
    recommendedExperienceType: 'INTERACTIVE_DIAGRAM',
    visualRepresentation: 'interactive_diagram',
    fallbackExperience: 'interactive_diagram',
    keyPrinciples: ['Law of Demand & Law of Supply', 'Equilibrium Clearing Price', 'Elasticity Responsiveness'],
  },
];

export class TopicResolver {
  /**
   * Normalizes raw user input topic text into standard matching tokens.
   */
  static normalizeTopic(rawTopic: string): string {
    return (rawTopic || '')
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, ' ');
  }

  /**
   * Resolves any user topic into a structured UniversalLearningTopic.
   */
  static resolveTopic(
    rawTopic: string,
    options: TopicResolverOptions = {}
  ): UniversalLearningTopic {
    const raw = (rawTopic || '').trim() || 'General Science';
    let normalized = TopicResolver.normalizeTopic(raw);
    if (!normalized || normalized.length === 0) {
      normalized = 'general science';
    }
    let baseTopic: UniversalLearningTopic | undefined;

    // 1. Check curated database for an exact or substring match
    for (const template of CURATED_TOPICS) {
      const match = template.normalizedKeys.some(
        (key) => normalized === key || normalized.includes(key) || key.includes(normalized)
      );

      if (match) {
        baseTopic = {
          topicId: template.conceptIds[0],
          rawUserTopic: raw,
          normalizedTopic: normalized,
          subject: (options.subject as SubjectCategory) || template.subject,
          domain: template.domain,
          conceptIds: template.conceptIds,
          prerequisites: template.prerequisites,
          learningObjectives: template.learningObjectives,
          difficulty: options.difficulty ?? template.difficulty,
          learnerLevel: (options.difficulty ?? template.difficulty) > 0.6 ? 'advanced' : (options.difficulty ?? template.difficulty) > 0.35 ? 'intermediate' : 'beginner',
          goal: options.goal || `Master the principles of ${raw}`,
          recommendedExperienceType: template.recommendedExperienceType,
          visualRepresentation: template.visualRepresentation,
          availableExperience: true,
          fallbackExperience: template.fallbackExperience,
          sourceGrounding: template.specializedExperienceId ? 'specialized_experience' : 'curated_topic_registry',
          confidence: 0.95,
          keyPrinciples: template.keyPrinciples,
        };
        break;
      }
    }

    // 2. Generic heuristic topic inference if not in curated catalog
    if (!baseTopic) {
      baseTopic = TopicResolver.inferGenericTopic(raw, normalized, options);
    }

    // 3. Enrich with Source Intelligence Knowledge Bundle
    const bundle = KnowledgeBundleService.buildBundle(raw, baseTopic.subject);
    const modeSelection = TeachingModeSelector.selectMode({
      normalizedTopic: baseTopic.normalizedTopic,
      subject: baseTopic.subject,
      domain: baseTopic.domain,
      keyPrinciples: baseTopic.keyPrinciples,
    });

    return {
      ...baseTopic,
      teachingMode: modeSelection.primaryMode,
      sources: bundle.sources,
      knowledgeBundle: bundle,
      sourceGrounding: (baseTopic.sourceGrounding === 'specialized_experience' || baseTopic.sourceGrounding === 'deterministic_fallback')
        ? baseTopic.sourceGrounding
        : (bundle.sources && bundle.sources.length > 0 ? 'source_backed' : baseTopic.sourceGrounding),
      keyPrinciples: bundle.principles && bundle.principles.length > 0
        ? bundle.principles.map((p) => p.statement)
        : baseTopic.keyPrinciples,
      interactiveVariables: bundle.suggestedManipulableVariables && bundle.suggestedManipulableVariables.length > 0
        ? bundle.suggestedManipulableVariables.map((iv) => ({
            name: iv.name,
            label: iv.label || iv.name,
            unit: iv.unit,
            min: iv.min,
            max: iv.max,
            defaultValue: iv.defaultValue,
            description: iv.educationalImpact,
          }))
        : baseTopic.interactiveVariables,
    };
  }

  /**
   * Deterministic heuristic decomposition for arbitrary / novel topics.
   */
  private static inferGenericTopic(
    rawTopic: string,
    normalized: string,
    options: TopicResolverOptions
  ): UniversalLearningTopic {
    const subject = (options.subject as SubjectCategory) || TopicResolver.detectSubject(normalized);
    const domain = `${subject} Conceptual Foundations`;
    const safeId = `topic_${normalized.replace(/[^a-z0-9]/g, '_').slice(0, 30)}`;

    // Infer best experience family based on subject and semantic keywords
    let recommendedExperienceType: UniversalExperienceFamily = 'EXPLORER';
    let visualRepresentation: VisualRepresentationMode = '3d_scene';
    let fallbackExperience: FallbackExperienceType = 'interactive_diagram';

    if (
      normalized.includes('circuit') ||
      normalized.includes('motion') ||
      normalized.includes('orbit') ||
      normalized.includes('wave') ||
      normalized.includes('gravity') ||
      normalized.includes('collision') ||
      subject === 'Physics'
    ) {
      recommendedExperienceType = 'SIMULATION';
      visualRepresentation = '3d_scene';
      fallbackExperience = 'interactive_diagram';
    } else if (
      normalized.includes('code') ||
      normalized.includes('program') ||
      normalized.includes('algorithm') ||
      normalized.includes('function') ||
      subject === 'Computer Science'
    ) {
      recommendedExperienceType = 'CODE_LAB';
      visualRepresentation = 'interactive_simulation';
      fallbackExperience = 'practice_challenge';
    } else if (
      normalized.includes('molecule') ||
      normalized.includes('atom') ||
      normalized.includes('reaction') ||
      normalized.includes('bond') ||
      subject === 'Chemistry'
    ) {
      recommendedExperienceType = 'BUILDER';
      visualRepresentation = '3d_scene';
      fallbackExperience = 'interactive_diagram';
    } else if (
      normalized.includes('anatomy') ||
      normalized.includes('organ') ||
      normalized.includes('cell') ||
      normalized.includes('species') ||
      subject === 'Biology'
    ) {
      recommendedExperienceType = 'EXPLORER';
      visualRepresentation = '3d_scene';
      fallbackExperience = 'interactive_diagram';
    } else if (
      normalized.includes('fraction') ||
      normalized.includes('geometry') ||
      normalized.includes('calculus') ||
      normalized.includes('matrix') ||
      subject === 'Mathematics'
    ) {
      recommendedExperienceType = 'INTERACTIVE_DIAGRAM';
      visualRepresentation = '3d_scene';
      fallbackExperience = 'structured_visual';
    } else if (
      normalized.includes('market') ||
      normalized.includes('economy') ||
      normalized.includes('money') ||
      subject === 'Economics'
    ) {
      recommendedExperienceType = 'INTERACTIVE_DIAGRAM';
      visualRepresentation = 'interactive_diagram';
      fallbackExperience = 'interactive_diagram';
    } else if (
      normalized.includes('history') ||
      normalized.includes('war') ||
      normalized.includes('revolution') ||
      subject === 'History'
    ) {
      recommendedExperienceType = 'SCENARIO';
      visualRepresentation = 'structured_visual';
      fallbackExperience = 'scenario';
    } else if (
      normalized.includes('grammar') ||
      normalized.includes('verb') ||
      normalized.includes('noun') ||
      subject === 'Language & Grammar'
    ) {
      recommendedExperienceType = 'VISUAL_EXPLANATION';
      visualRepresentation = 'structured_visual';
      fallbackExperience = 'structured_visual';
    }

    const keyPrinciples = [
      `Fundamental Mechanism of ${rawTopic}`,
      `Interactive Variable Relationships`,
      `Observable System Outcomes`,
    ];

    const learningObjectives = [
      `Understand the core conceptual mechanism of ${rawTopic}.`,
      `Observe and predict how modifying key variables impacts the system.`,
      `Synthesize findings through interactive experimentation.`,
    ];

    return {
      topicId: safeId,
      rawUserTopic: rawTopic,
      normalizedTopic: normalized,
      subject,
      domain,
      conceptIds: [safeId],
      prerequisites: [`Introduction to ${subject}`],
      learningObjectives,
      difficulty: options.difficulty ?? 0.5,
      learnerLevel: 'intermediate',
      goal: options.goal || `Explore and understand ${rawTopic}`,
      recommendedExperienceType,
      visualRepresentation,
      availableExperience: true,
      fallbackExperience,
      sourceGrounding: 'deterministic_fallback',
      confidence: 0.85,
      keyPrinciples,
    };
  }

  /**
   * Identifies likely subject category from text tokens.
   */
  private static detectSubject(normalized: string): SubjectCategory {
    if (/\b(force|motion|energy|velocity|gravity|circuit|wave|quantum|thermo|kinematics|magnet|magnetic|bose|condensate|relativity|optics)\b/.test(normalized)) {
      return 'Physics';
    }
    if (/\b(cell|dna|gene|plant|heart|organ|bacteria|protein|photosynthesis|ecology|evolution)\b/.test(normalized)) {
      return 'Biology';
    }
    if (/\b(atom|molecule|bond|reaction|acid|base|compound|catalyst|valence|chemical)\b/.test(normalized)) {
      return 'Chemistry';
    }
    if (/\b(fraction|number|equation|calculus|geometry|algebra|probability|matrix|integral)\b/.test(normalized)) {
      return 'Mathematics';
    }
    if (/\b(code|python|algorithm|data|tree|array|loop|binary|function|sorting|variable)\b/.test(normalized)) {
      return 'Computer Science';
    }
    if (/\b(sun|planet|orbit|star|galaxy|astronomy|solar|moon|comet|kepler)\b/.test(normalized)) {
      return 'Astronomy';
    }
    if (/\b(market|price|demand|supply|inflation|trade|money|gdp|economy|cost)\b/.test(normalized)) {
      return 'Economics';
    }
    if (/\b(war|revolution|empire|century|ancient|treaty|historical|reign|dynasty)\b/.test(normalized)) {
      return 'History';
    }
    if (/\b(grammar|syntax|verb|noun|clause|sentence|tense|punctuation|english)\b/.test(normalized)) {
      return 'Language & Grammar';
    }
    return 'General Science';
  }
}
