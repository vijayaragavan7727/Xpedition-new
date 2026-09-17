/**
 * Experience Engine Milestone 4: Experience #3 — Molecule Builder Config
 *
 * Demonstrates engine reusability across 3 modalities:
 * Experience #1: Physics Simulation (Projectile Motion)
 * Experience #2: 3D Spatial Manipulation (Scholar's Prism)
 * Experience #3: 3D Molecular Building with Domain Rules (Water H₂O)
 *
 * Same architecture: Scene + Interaction + Domain Rules + Challenge + Telemetry + Xira + Learner Model
 */

import {
  ExperienceConfig,
  MoleculeBuilderConfig,
  ExperienceResult,
  XiraExperienceObservation,
  MoleculeBond,
} from '../types';
import { Quest } from '../../types';

/**
 * Declarative configuration for Water (H₂O) molecule.
 */
export const H2O_MOLECULE_CONFIG: MoleculeBuilderConfig = {
  moleculeId: 'h2o',
  moleculeFormula: 'H₂O',
  moleculeName: 'Water',
  atoms: [
    {
      id: 'o1',
      elementSymbol: 'O',
      elementName: 'Oxygen',
      valence: 2,
      maxBonds: 2,
      colorHex: 0xef4444, // Crimson Red (standard CPK coloring for Oxygen)
      radius: 0.85,
      initialPosition: [0, 0.4, 0],
    },
    {
      id: 'h1',
      elementSymbol: 'H',
      elementName: 'Hydrogen 1',
      valence: 1,
      maxBonds: 1,
      colorHex: 0xe2e8f0, // Slate Light / White (standard CPK for Hydrogen)
      radius: 0.52,
      initialPosition: [-2.2, -1.0, 0],
    },
    {
      id: 'h2',
      elementSymbol: 'H',
      elementName: 'Hydrogen 2',
      valence: 1,
      maxBonds: 1,
      colorHex: 0xe2e8f0,
      radius: 0.52,
      initialPosition: [2.2, -1.0, 0],
    },
  ],
  targetBonds: [
    { fromAtomId: 'o1', toAtomId: 'h1' },
    { fromAtomId: 'o1', toAtomId: 'h2' },
  ],
  valenceRules: {
    O: 2,
    H: 1,
  },
  disallowedBonds: [
    {
      fromType: 'H',
      toType: 'H',
      reason:
        'In water (H₂O), hydrogen atoms bond directly to oxygen. Hydrogen atoms do not bond to each other in this molecule.',
    },
  ],
  prediction: {
    prompt: 'How many hydrogen atoms does oxygen need to form a stable water molecule?',
    explanation:
      'Oxygen has 6 valence electrons and needs 2 additional electrons to achieve an octet, which it gains by sharing electrons with two hydrogen atoms.',
    options: [
      { id: 'opt_1', label: '1 Hydrogen atom', isCorrect: false },
      {
        id: 'opt_2',
        label: '2 Hydrogen atoms',
        isCorrect: true,
        description: 'Oxygen needs two single covalent bonds to complete its valence shell.',
      },
      { id: 'opt_3', label: '3 Hydrogen atoms', isCorrect: false },
      { id: 'opt_4', label: '4 Hydrogen atoms', isCorrect: false },
    ],
  },
};

/**
 * Master Experience Configuration for Molecule Builder.
 */
export const MOLECULE_BUILDER_EXPERIENCE: ExperienceConfig = {
  id: 'exp_chem_h2o_builder',
  conceptId: 'molecular_bonding',
  conceptName: 'Molecular Bonding: Water (H₂O)',
  title: 'Molecule Builder: Water (H₂O)',
  subtitle: 'Construct covalent bonds in 3D space',
  difficulty: 0.35,
  experienceType: 'MOLECULE_BUILDER',
  molecule: H2O_MOLECULE_CONFIG,
  challenge: {
    objective:
      'Construct a stable water (H₂O) molecule by forming covalent bonds between oxygen and hydrogen atoms.',
    instructions:
      'Click an atom to select it, then click a partner to form a bond. Connect oxygen to both hydrogens.',
    successCondition: 'Form 2 valid O–H bonds without exceeding atom valence.',
    hints: [
      'Oxygen has a valence of 2, meaning it needs two single bonds to complete its outer shell.',
      'Each hydrogen atom has a valence of 1 and can only form one covalent bond.',
      'Click on Oxygen, then click on Hydrogen 1 to form the first bond.',
    ],
  },
  briefing: {
    title: 'Molecular Architecture Lab',
    objective:
      'Build a stable water (H₂O) molecule by pairing valence electrons into covalent bonds.',
    context:
      'Atoms form chemical bonds to achieve stable electron configurations. In water, the central oxygen atom shares pairs of electrons with two hydrogen atoms.',
    targetOutcome:
      'Understand how atomic valence dictates molecular structure and bond relationships.',
    hints: [
      'Select Oxygen, then click a Hydrogen to form the first covalent bond.',
      'Remember: Hydrogen can only form one bond, so Hydrogen atoms cannot bond to each other in water.',
    ],
  },
  reflectionPrompts: [
    {
      id: 'refl_chem_valence',
      prompt:
        'Why does oxygen require exactly two hydrogen atoms to become stable in water, rather than one or three?',
      conceptConnection:
        'Oxygen has 6 valence electrons and needs 2 electrons to complete its octet, requiring 2 single covalent bonds.',
    },
    {
      id: 'refl_chem_geometry',
      prompt:
        'Why do the two hydrogen atoms form an angular bent shape around oxygen instead of a straight line?',
      conceptConnection:
        'Oxygen possesses two lone electron pairs that exert repulsion, bending the O-H bonds into a ~104.5° angle.',
    },
  ],
};

/**
 * Quest Definition integrating the 3D Molecule Builder into the Canonical Quest Loop.
 */
export const MOLECULE_BUILDER_QUEST: Quest & Record<string, any> = {
  id: 'quest_molecular_bonding_01',
  conceptId: 'molecular_bonding',
  conceptName: 'Molecular Bonding: Water (H₂O)',
  prompt: 'In a water molecule (H₂O), what structural rule determines how many hydrogen atoms bond to oxygen?',
  options: [
    'Hydrogen can form three bonds because it is lightweight',
    'Oxygen needs two additional electrons to complete its valence shell, forming two single O–H bonds',
    'Hydrogen atoms must bond directly to each other before attaching to oxygen',
    'Covalent bonds can form without any valence restrictions',
  ],
  correctIndex: 1,
  difficulty: 0.35,
  experienceType: 'MOLECULE_BUILDER',
  experienceId: 'exp_chem_h2o_builder',
  objective:
    'Construct a stable water (H₂O) molecule by forming covalent bonds between oxygen and hydrogen atoms.',
  briefing:
    'Enter the Molecular Architecture Lab. Manipulate atoms in 3D and discover how electron valence governs covalent bond formation.',
  items: [
    {
      id: 'item_molecular_h2o_exp',
      type: 'interactive_simulation',
      title: 'Interactive Lab: Water Molecule Builder',
      description: 'Construct a water (H₂O) molecule by forming covalent bonds between oxygen and hydrogen atoms.',
      concept: 'molecular_bonding',
      points: 100,
      experienceType: 'MOLECULE_BUILDER',
      experienceConfig: MOLECULE_BUILDER_EXPERIENCE,
    },
    {
      id: 'item_molecular_reflection',
      type: 'reflection',
      title: 'Molecular Bonding Debrief',
      description: 'Reflect on valence shell rules and covalent electron sharing.',
      concept: 'molecular_bonding',
      points: 50,
      question:
        'How does the concept of atomic valence explain why water is H₂O rather than H₃O or HO in everyday chemistry?',
    },
  ],
  experienceConfig: MOLECULE_BUILDER_EXPERIENCE,
};

/**
 * Converts molecular builder telemetry and bond structure into the canonical ExperienceResult contract.
 */
export const createMoleculeExperienceResult = (
  config: ExperienceConfig,
  observation: XiraExperienceObservation,
  bondsFormed: MoleculeBond[],
  isComplete: boolean,
  invalidBondAttemptsCount: number,
  timeSpentSeconds: number
): ExperienceResult => {
  const score = isComplete
    ? Math.max(80, 100 - invalidBondAttemptsCount * 5)
    : Math.max(20, bondsFormed.length * 30);

  const evidenceSignals: string[] = [];
  if (isComplete) {
    evidenceSignals.push('Constructed valid water (H₂O) molecular structure');
  }
  if (invalidBondAttemptsCount === 0) {
    evidenceSignals.push('Demonstrated flawless valence reasoning on first attempt');
  } else {
    evidenceSignals.push(`Overcame ${invalidBondAttemptsCount} bonding misconceptions through interaction`);
  }

  return {
    experienceId: config.id,
    conceptId: config.conceptId,
    conceptName: config.conceptName,
    attempts: 1,
    successfulAttempts: isComplete ? 1 : 0,
    completed: isComplete,
    score,
    trialsCount: observation.totalTrials ?? 1,
    totalInteractions: observation.totalInteractions ?? bondsFormed.length + invalidBondAttemptsCount,
    timeSpentSeconds,
    timestamp: Date.now(),
    xiraObservation: observation,
    molecularEvidence: {
      moleculeFormula: config.molecule?.moleculeFormula || 'H₂O',
      bondsFormed: [...bondsFormed],
      targetBondsMatched: isComplete,
      invalidBondAttemptsCount,
      valenceSatisfied: isComplete,
    },
    summaryFeedback: isComplete
      ? `Water (H₂O) structure successfully constructed! You demonstrated understanding of oxygen's 2-bond valence capacity.`
      : `Molecular assembly incomplete. Formed ${bondsFormed.length} of 2 required O–H bonds.`,
    nextActionRecommendation: isComplete
      ? 'Advance to multi-center molecules (e.g. Methane CH₄ or Carbon Dioxide CO₂).'
      : 'Review valence electron shells and retry forming the two O–H bonds.',
    evidenceSignals,
  };
};
