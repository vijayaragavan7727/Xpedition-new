/**
 * Xpedition Unified Curriculum & Topic Catalog
 *
 * Provides grounded academic topics across 8 core disciplines:
 * Physics, Mathematics, Chemistry, Biology, Programming, Data Science, English, History/GK.
 *
 * Integrates directly with:
 * - /learn topic selection and launcher
 * - /class?concept=<conceptId> routing
 * - ClassroomLayout and XiraClassroomOrchestrator
 * - Visual Intelligence Representation Resolver
 */

import { RepresentationType } from '@/lib/visualIntelligence/types';

export interface CurriculumTopic {
  conceptId: string;
  title: string;
  subject: string;
  description: string;
  estimatedMinutes: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  visualType: RepresentationType;
  category: string;
  keyTakeaway: string;
  isPopular?: boolean;
}

export interface CurriculumSubject {
  id: string;
  title: string;
  iconName: string;
  description: string;
  color: string;
  accentColor: string;
  topics: CurriculumTopic[];
}

export const CURRICULUM_SUBJECTS: CurriculumSubject[] = [
  {
    id: 'physics',
    title: 'Physics',
    iconName: 'Atom',
    description: 'Mechanics, electromagnetism, optics, and wave dynamics.',
    color: '#0F5132',
    accentColor: '#22c55e',
    topics: [
      {
        conceptId: 'dc_motor',
        title: 'DC Electric Motor & Commutation',
        subject: 'Physics',
        description: 'Discover how Lorentz magnetic force and split-ring commutation produce continuous rotational mechanical torque.',
        estimatedMinutes: 10,
        level: 'Intermediate',
        visualType: 'scientific_diagram',
        category: 'Electromagnetism',
        keyTakeaway: 'Current through loop in B-field creates torque; commutator inverts current every half-turn.',
        isPopular: true,
      },
      {
        conceptId: 'projectile_motion',
        title: 'Projectile Motion & Kinematics',
        subject: 'Physics',
        description: 'Predict parabolic trajectories by decoupling horizontal uniform velocity from vertical gravitational acceleration.',
        estimatedMinutes: 8,
        level: 'Beginner',
        visualType: 'interactive_simulation',
        category: 'Classical Mechanics',
        keyTakeaway: 'Horizontal motion has constant speed; vertical motion accelerates downward at g = 9.8 m/s².',
        isPopular: true,
      },
      {
        conceptId: 'motion_forces',
        title: 'Newtonian Forces & Linear Momentum',
        subject: 'Physics',
        description: 'Examine Newton’s three laws of motion, free-body force vectors, and conservation of linear momentum.',
        estimatedMinutes: 9,
        level: 'Beginner',
        visualType: 'scientific_diagram',
        category: 'Classical Mechanics',
        keyTakeaway: 'Net force equals rate of change of momentum (F = m·a); every action has an equal opposite reaction.',
      },
      {
        conceptId: 'electromagnetic_force',
        title: 'Lorentz Force & Magnetic Fields',
        subject: 'Physics',
        description: 'Master Fleming’s Left-Hand rule, magnetic flux density vectors, and charged particle deflection paths.',
        estimatedMinutes: 9,
        level: 'Intermediate',
        visualType: 'scientific_diagram',
        category: 'Electromagnetism',
        keyTakeaway: 'Moving electric charges experience perpendicular Lorentz force F = q(v × B).',
      },
    ],
  },
  {
    id: 'mathematics',
    title: 'Mathematics',
    iconName: 'Calculator',
    description: 'Algebra, analytical geometry, calculus, and probability.',
    color: '#1E3A8A',
    accentColor: '#38bdf8',
    topics: [
      {
        conceptId: 'quadratic_equation',
        title: 'Quadratic Equations & Parabolas',
        subject: 'Mathematics',
        description: 'Explore parabolic graphs, vertex coordinates, real roots, and discriminant sensitivity.',
        estimatedMinutes: 10,
        level: 'Beginner',
        visualType: 'graph',
        category: 'Algebra & Functions',
        keyTakeaway: 'Parabola vertex is at x = -b/2a; roots exist when discriminant b² - 4ac ≥ 0.',
        isPopular: true,
      },
      {
        conceptId: 'coordinate_geometry',
        title: 'Coordinate Geometry & Circles',
        subject: 'Mathematics',
        description: 'Analyze Cartesian distance formulas, circle equations, tangents, and radii in 2D space.',
        estimatedMinutes: 8,
        level: 'Intermediate',
        visualType: 'scientific_diagram',
        category: 'Analytical Geometry',
        keyTakeaway: 'Circle equation (x - h)² + (y - k)² = r² defines equidistant points from center (h, k).',
      },
      {
        conceptId: 'probability_distributions',
        title: 'Probability & Bayes’ Theorem',
        subject: 'Mathematics',
        description: 'Understand conditional probability, sample spaces, and updating prior beliefs with new evidence.',
        estimatedMinutes: 10,
        level: 'Advanced',
        visualType: 'graph',
        category: 'Statistics & Probability',
        keyTakeaway: 'P(A|B) = [P(B|A) · P(A)] / P(B) updates probability based on observed likelihood.',
      },
    ],
  },
  {
    id: 'chemistry',
    title: 'Chemistry',
    iconName: 'FlaskConical',
    description: 'Molecular structure, chemical bonds, and reaction dynamics.',
    color: '#065F46',
    accentColor: '#10b981',
    topics: [
      {
        conceptId: 'molecular_bonding',
        title: 'Covalent Bonding & Molecular Geometry',
        subject: 'Chemistry',
        description: 'Examine electron sharing, VSEPR orbital repulsion, and the 104.5° bent geometry of water molecules.',
        estimatedMinutes: 8,
        level: 'Beginner',
        visualType: 'molecular_visual',
        category: 'Molecular Chemistry',
        keyTakeaway: 'Electron pairs repel to maximize spatial separation, dictating 3D molecular bond angles.',
        isPopular: true,
      },
      {
        conceptId: 'chemical_reactions',
        title: 'Reaction Kinetics & Stoichiometry',
        subject: 'Chemistry',
        description: 'Balance conservation of mass across chemical reactions and evaluate activation energy barriers.',
        estimatedMinutes: 9,
        level: 'Intermediate',
        visualType: 'formula_visual',
        category: 'Physical Chemistry',
        keyTakeaway: 'Reactants transform into products conserving atomic mass; catalysts lower activation energy.',
      },
      {
        conceptId: 'periodic_table',
        title: 'Periodic Trends & Electronegativity',
        subject: 'Chemistry',
        description: 'Map atomic radius, ionization energy, and electronegativity trends across periods and groups.',
        estimatedMinutes: 7,
        level: 'Beginner',
        visualType: 'scientific_diagram',
        category: 'Inorganic Chemistry',
        keyTakeaway: 'Electronegativity increases up and to the right due to effective nuclear charge.',
      },
    ],
  },
  {
    id: 'biology',
    title: 'Biology',
    iconName: 'Dna',
    description: 'Human anatomy, cellular biochemistry, and genetics.',
    color: '#831843',
    accentColor: '#f43f5e',
    topics: [
      {
        conceptId: 'human_heart_anatomy',
        title: 'Human Heart Anatomy & Dual Circulation',
        subject: 'Biology',
        description: 'Trace blood flow through four chambers, atrioventricular valves, and dual pulmonary/systemic circuits.',
        estimatedMinutes: 8,
        level: 'Intermediate',
        visualType: 'anatomical_visual',
        category: 'Anatomy & Physiology',
        keyTakeaway: 'Right heart pumps to pulmonary lungs; thick left ventricle pumps to entire systemic body.',
        isPopular: true,
      },
      {
        conceptId: 'cellular_respiration',
        title: 'Cellular Respiration & ATP Synthesis',
        subject: 'Biology',
        description: 'Discover glycolysis, the Krebs cycle, and mitochondrial electron transport chain generating ATP.',
        estimatedMinutes: 10,
        level: 'Advanced',
        visualType: 'scientific_diagram',
        category: 'Biochemistry',
        keyTakeaway: 'Glucose and oxygen convert into CO₂, water, and roughly 30–32 ATP molecules.',
      },
      {
        conceptId: 'dna_genetics',
        title: 'DNA Double Helix & Gene Expression',
        subject: 'Biology',
        description: 'Investigate nucleotide base pairs (A-T, C-G), replication forks, and transcription into mRNA.',
        estimatedMinutes: 9,
        level: 'Beginner',
        visualType: 'molecular_visual',
        category: 'Genetics',
        keyTakeaway: 'Hydrogen bonds pair complementary bases (A with T, C with G) along antiparallel sugar-phosphate backbones.',
      },
    ],
  },
  {
    id: 'programming',
    title: 'Programming',
    iconName: 'Code',
    description: 'Algorithms, data structures, and computational thinking.',
    color: '#312E81',
    accentColor: '#818cf8',
    topics: [
      {
        conceptId: 'binary_search',
        title: 'Binary Search & Divide and Conquer',
        subject: 'Programming',
        description: 'Halve logarithmic search spaces efficiently using low, mid, and high array index pointers in O(log n).',
        estimatedMinutes: 8,
        level: 'Beginner',
        visualType: 'code_visual',
        category: 'Algorithms',
        keyTakeaway: 'On sorted arrays, comparing with middle element cuts remaining search space in half every iteration.',
        isPopular: true,
      },
      {
        conceptId: 'recursion_trees',
        title: 'Recursion & Call Stack Frames',
        subject: 'Programming',
        description: 'Trace recursive base conditions, recursive breakdown, and stack frame unwinding.',
        estimatedMinutes: 10,
        level: 'Intermediate',
        visualType: 'code_visual',
        category: 'Data Structures',
        keyTakeaway: 'Every recursive call pushes a stack frame; base cases halt unbounded recursion and prevent stack overflow.',
      },
      {
        conceptId: 'hash_tables',
        title: 'Hash Tables & Collision Resolution',
        subject: 'Programming',
        description: 'Map string keys to bucket indices using hash functions and examine separate chaining vs open addressing.',
        estimatedMinutes: 9,
        level: 'Intermediate',
        visualType: 'scientific_diagram',
        category: 'Data Structures',
        keyTakeaway: 'Uniform hash distribution guarantees O(1) average time complexity for lookups, insertions, and deletions.',
      },
    ],
  },
  {
    id: 'data_science',
    title: 'Data Science',
    iconName: 'BarChart3',
    description: 'Statistics, predictive regression, and machine learning.',
    color: '#134E4A',
    accentColor: '#14b8a6',
    topics: [
      {
        conceptId: 'linear_regression',
        title: 'Linear Regression & Best Fit Line',
        subject: 'Data Science',
        description: 'Minimize ordinary least squares error to find optimal slope (m) and intercept (c) for predictive modeling.',
        estimatedMinutes: 10,
        level: 'Beginner',
        visualType: 'graph',
        category: 'Machine Learning',
        keyTakeaway: 'Best fit line minimizes sum of squared residuals: y = mx + c.',
        isPopular: true,
      },
      {
        conceptId: 'decision_boundaries',
        title: 'Classification & Decision Boundaries',
        subject: 'Data Science',
        description: 'Separate multidimensional feature clusters using hyperplanes, logistic regression, and margin boundaries.',
        estimatedMinutes: 9,
        level: 'Intermediate',
        visualType: 'graph',
        category: 'Machine Learning',
        keyTakeaway: 'Decision boundaries partition feature space into distinct class prediction zones.',
      },
      {
        conceptId: 'normal_distribution',
        title: 'Normal Distribution & 68-95-99.7 Rule',
        subject: 'Data Science',
        description: 'Inspect bell curve probability density, mean (μ), standard deviation (σ), and central limit theorem.',
        estimatedMinutes: 8,
        level: 'Beginner',
        visualType: 'graph',
        category: 'Statistical Theory',
        keyTakeaway: '68% of data lies within 1σ of the mean, 95% within 2σ, and 99.7% within 3σ.',
      },
    ],
  },
  {
    id: 'english',
    title: 'English',
    iconName: 'BookOpen',
    description: 'Rhetoric, argumentative analysis, and literary synthesis.',
    color: '#701A75',
    accentColor: '#e879f9',
    topics: [
      {
        conceptId: 'rhetorical_devices',
        title: 'Rhetorical Devices & Persuasive Analysis',
        subject: 'English',
        description: 'Deconstruct Aristotle’s persuasive triad (Ethos, Pathos, Logos) and rhetorical figurative devices.',
        estimatedMinutes: 8,
        level: 'Beginner',
        visualType: 'scientific_diagram',
        category: 'Rhetorical Analysis',
        keyTakeaway: 'Ethos builds credibility, Pathos appeals to empathy, and Logos proves claims with sound logic.',
        isPopular: true,
      },
      {
        conceptId: 'narrative_structure',
        title: 'Freytag’s Pyramid & Narrative Arc',
        subject: 'English',
        description: 'Analyze exposition, inciting incident, rising action, climax, falling action, and resolution.',
        estimatedMinutes: 9,
        level: 'Beginner',
        visualType: 'timeline',
        category: 'Literary Structure',
        keyTakeaway: 'Narrative tension peaks at climax before resolving core thematic conflicts.',
      },
    ],
  },
  {
    id: 'history_gk',
    title: 'History/GK',
    iconName: 'Landmark',
    description: 'World history, political revolutions, and civilization milestones.',
    color: '#78350F',
    accentColor: '#f59e0b',
    topics: [
      {
        conceptId: 'french_revolution',
        title: 'The French Revolution & Republic (1789)',
        subject: 'History/GK',
        description: 'Chart the collapse of the Ancien Régime, storming of the Bastille, and declaration of human rights.',
        estimatedMinutes: 10,
        level: 'Intermediate',
        visualType: 'timeline',
        category: 'Modern European History',
        keyTakeaway: 'Popular uprising replaced absolute monarchy with constitutional equality: Liberté, Égalité, Fraternité.',
        isPopular: true,
      },
      {
        conceptId: 'industrial_revolution',
        title: 'The Industrial Revolution & Steam Power',
        subject: 'History/GK',
        description: 'Explore the transition from agrarian craft to steam mechanization, textile factories, and urban growth.',
        estimatedMinutes: 9,
        level: 'Beginner',
        visualType: 'timeline',
        category: 'Economic History',
        keyTakeaway: 'Watt’s steam engine and mechanized manufacturing transformed global production and urbanization.',
      },
    ],
  },
];

/**
 * Helper to retrieve a topic by conceptId
 */
export function getCurriculumTopic(conceptId: string): CurriculumTopic | undefined {
  const norm = conceptId.toLowerCase().trim();
  for (const sub of CURRICULUM_SUBJECTS) {
    const found = sub.topics.find((t) => t.conceptId.toLowerCase() === norm);
    if (found) return found;
  }
  return undefined;
}

/**
 * Helper to retrieve all topics across all subjects
 */
export function getAllCurriculumTopics(): CurriculumTopic[] {
  return CURRICULUM_SUBJECTS.flatMap((s) => s.topics);
}
