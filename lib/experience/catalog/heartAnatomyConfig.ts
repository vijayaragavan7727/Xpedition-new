/**
 * Experience Engine Milestone 5: Experience #4 — 3D Human Heart Anatomy Explorer
 *
 * Demonstrates engine reusability across 4 modalities:
 * Experience #1: Physics Simulation (Projectile Motion)
 * Experience #2: 3D Spatial Manipulation (Scholar's Prism)
 * Experience #3: 3D Molecular Building (Water H₂O)
 * Experience #4: 3D Biological Anatomy Exploration (Human Heart)
 *
 * Uses the SAME Experience Engine architecture:
 * Scene + Interaction + Domain Rules + Challenge + Telemetry + Xira + Learner Model
 */

import {
  HeartStructureDefinition,
  AnatomyChallenge,
  CANONICAL_BLOOD_FLOW_PATH,
  HeartAnatomyState,
} from '../domain/heartAnatomyRules';
import { ExperienceConfig, ExperienceResult, XiraExperienceObservation } from '../types';

export const HEART_STRUCTURES: HeartStructureDefinition[] = [
  {
    id: 'vena_cava',
    name: 'Superior & Inferior Vena Cava',
    category: 'vessel',
    side: 'right',
    bloodType: 'deoxygenated',
    shortDescription: 'Large systemic veins returning oxygen-depleted blood from the upper and lower body to the right atrium.',
    clinicalSignificance: 'Entry point of venous return into the cardiac cycle.',
    position3D: [-1.6, 2.2, -0.4],
    colorHex: '#3b82f6', // Cobalt Blue
  },
  {
    id: 'right_atrium',
    name: 'Right Atrium',
    category: 'chamber',
    side: 'right',
    bloodType: 'deoxygenated',
    shortDescription: 'Receives deoxygenated blood from the vena cava and holds it before passage to the right ventricle.',
    clinicalSignificance: 'Houses the Sinoatrial (SA) node, the heart’s natural electrical pacemaker.',
    position3D: [-1.4, 0.8, 0.5],
    colorHex: '#60a5fa', // Light Blue
  },
  {
    id: 'tricuspid_valve',
    name: 'Tricuspid Valve',
    category: 'valve',
    side: 'right',
    bloodType: 'deoxygenated',
    shortDescription: 'Three-cusp atrioventricular valve preventing retrograde backflow from the right ventricle into the right atrium.',
    clinicalSignificance: 'Closes during ventricular systole to produce the first heart sound (S1).',
    position3D: [-1.0, 0.0, 0.7],
    colorHex: '#93c5fd', // Soft Blue
  },
  {
    id: 'right_ventricle',
    name: 'Right Ventricle',
    category: 'chamber',
    side: 'right',
    bloodType: 'deoxygenated',
    shortDescription: 'Muscular pump that propels deoxygenated blood through the pulmonary valve into the pulmonary circulation.',
    clinicalSignificance: 'Operates at lower pressure than the left ventricle due to low pulmonary resistance.',
    position3D: [-0.8, -1.2, 0.8],
    colorHex: '#2563eb', // Royal Blue
  },
  {
    id: 'pulmonary_valve',
    name: 'Pulmonary Valve',
    category: 'valve',
    side: 'central',
    bloodType: 'deoxygenated',
    shortDescription: 'Semilunar valve between the right ventricle and the pulmonary trunk.',
    clinicalSignificance: 'Prevents backflow into the right ventricle during ventricular diastole.',
    position3D: [-0.3, 0.5, 0.9],
    colorHex: '#38bdf8', // Cyan
  },
  {
    id: 'pulmonary_artery',
    name: 'Pulmonary Artery',
    category: 'vessel',
    side: 'central',
    bloodType: 'deoxygenated',
    shortDescription: 'Branches into left and right arteries carrying deoxygenated blood to both lungs for gas exchange.',
    clinicalSignificance: 'The only adult artery carrying oxygen-poor blood.',
    position3D: [0.0, 1.8, 0.6],
    colorHex: '#0284c7', // Deep Cyan
  },
  {
    id: 'pulmonary_veins',
    name: 'Pulmonary Veins',
    category: 'vessel',
    side: 'left',
    bloodType: 'oxygenated',
    shortDescription: 'Four pulmonary veins delivering freshly oxygenated blood from the lungs into the left atrium.',
    clinicalSignificance: 'The only adult veins carrying oxygen-rich blood.',
    position3D: [1.8, 1.2, -0.6],
    colorHex: '#f87171', // Coral Red
  },
  {
    id: 'left_atrium',
    name: 'Left Atrium',
    category: 'chamber',
    side: 'left',
    bloodType: 'oxygenated',
    shortDescription: 'Receives oxygen-rich blood returning from the lungs and directs it across the mitral valve into the left ventricle.',
    clinicalSignificance: 'Forms the posterior base of the cardiac silhouette.',
    position3D: [1.3, 0.8, -0.2],
    colorHex: '#ef4444', // Crimson Red
  },
  {
    id: 'mitral_valve',
    name: 'Mitral (Bicuspid) Valve',
    category: 'valve',
    side: 'left',
    bloodType: 'oxygenated',
    shortDescription: 'Dual-cusp valve between left atrium and left ventricle capable of withstanding peak systemic systolic pressures.',
    clinicalSignificance: 'Most prone to valvular regurgitation and stenosis.',
    position3D: [0.9, 0.0, 0.4],
    colorHex: '#fca5a5', // Soft Pink Red
  },
  {
    id: 'left_ventricle',
    name: 'Left Ventricle',
    category: 'chamber',
    side: 'left',
    bloodType: 'oxygenated',
    shortDescription: 'Thickest muscular chamber generating high pressure to pump oxygenated blood through the aorta into systemic circulation.',
    clinicalSignificance: 'Three times thicker than the right ventricle to overcome systemic vascular resistance.',
    position3D: [0.8, -1.3, 0.2],
    colorHex: '#dc2626', // Deep Crimson
  },
  {
    id: 'aortic_valve',
    name: 'Aortic Valve',
    category: 'valve',
    side: 'central',
    bloodType: 'oxygenated',
    shortDescription: 'Three-leaflet semilunar valve situated between the left ventricle and the ascending aorta.',
    clinicalSignificance: 'Closure contributes to the second heart sound (S2).',
    position3D: [0.2, 0.4, 0.3],
    colorHex: '#fb7185', // Rose Red
  },
  {
    id: 'aorta',
    name: 'Aorta',
    category: 'vessel',
    side: 'central',
    bloodType: 'oxygenated',
    shortDescription: 'Largest blood vessel in the human body, arching over the pulmonary trunk to supply oxygenated blood to all organs.',
    clinicalSignificance: 'Originates coronary arteries supplying cardiac myocardium.',
    position3D: [0.3, 2.5, 0.0],
    colorHex: '#b91c1c', // Ruby Crimson
  },
];

export const HEART_CHALLENGES: AnatomyChallenge[] = [
  {
    id: 'ch_systemic_pump',
    prompt: 'Which chamber pumps oxygen-rich blood into the entire body via systemic circulation?',
    targetStructureId: 'left_ventricle',
    explanation: 'The left ventricle has the thickest myocardium to generate high pressures needed to circulate blood throughout the body.',
    options: [
      { id: 'left_ventricle', label: 'Left Ventricle', isCorrect: true },
      { id: 'right_ventricle', label: 'Right Ventricle', isCorrect: false },
      { id: 'left_atrium', label: 'Left Atrium', isCorrect: false },
      { id: 'aorta', label: 'Aorta', isCorrect: false },
    ],
  },
  {
    id: 'ch_mitral_valve',
    prompt: 'Which atrioventricular valve lies between the left atrium and left ventricle?',
    targetStructureId: 'mitral_valve',
    explanation: 'The mitral (bicuspid) valve regulates blood passage from the left atrium to the left ventricle.',
    options: [
      { id: 'mitral_valve', label: 'Mitral Valve', isCorrect: true },
      { id: 'tricuspid_valve', label: 'Tricuspid Valve', isCorrect: false },
      { id: 'aortic_valve', label: 'Aortic Valve', isCorrect: false },
      { id: 'pulmonary_valve', label: 'Pulmonary Valve', isCorrect: false },
    ],
  },
  {
    id: 'ch_pulmonary_flow',
    prompt: 'Where does deoxygenated blood travel immediately after leaving the right ventricle?',
    targetStructureId: 'pulmonary_artery',
    explanation: 'Blood passes through the pulmonary valve into the pulmonary artery, heading to the lungs for gas exchange.',
    options: [
      { id: 'pulmonary_artery', label: 'Pulmonary Artery', isCorrect: true },
      { id: 'pulmonary_veins', label: 'Pulmonary Veins', isCorrect: false },
      { id: 'aorta', label: 'Aorta', isCorrect: false },
      { id: 'right_atrium', label: 'Right Atrium', isCorrect: false },
    ],
  },
  {
    id: 'ch_venous_return',
    prompt: 'Which large vessels return oxygen-depleted blood from the body to the right atrium?',
    targetStructureId: 'vena_cava',
    explanation: 'The Superior and Inferior Vena Cava collect deoxygenated blood from the upper and lower body to enter the right atrium.',
    options: [
      { id: 'vena_cava', label: 'Superior & Inferior Vena Cava', isCorrect: true },
      { id: 'pulmonary_veins', label: 'Pulmonary Veins', isCorrect: false },
      { id: 'aorta', label: 'Aorta', isCorrect: false },
      { id: 'pulmonary_artery', label: 'Pulmonary Artery', isCorrect: false },
    ],
  },
];

export const HEART_ANATOMY_EXPERIENCE: ExperienceConfig = {
  id: 'exp_heart_anatomy_01',
  experienceType: 'HEART_ANATOMY_EXPLORER',
  conceptId: 'human_heart_anatomy',
  conceptName: 'Human Heart Anatomy & Blood Flow',
  title: '3D Human Heart Anatomy Explorer',
  subtitle: 'Explore the internal chambers, valves, and circulatory pathways of the human heart.',
  difficulty: 0.3,
  scene: {
    environmentType: 'lab',
    camera: {
      initialPosition: [0, 0, 7.5],
      lookAt: [0, 0, 0],
      fov: 45,
    },
    lighting: {
      ambientColor: '#1e1b4b',
      ambientIntensity: 0.9,
      directionalColor: '#ffffff',
      directionalPosition: [5, 10, 8],
    },
  },
  challenge: {
    objective: 'Explore the human heart and identify how blood moves through its chambers and valves.',
    instructions: 'Click and drag to rotate the 3D heart. Select chambers and valves to inspect their functions, follow the blood flow path, and answer contextual challenges.',
    successCondition: 'Inspect at least 4 anatomical structures and trace the cardiac blood flow sequence or solve 2 challenges.',
    hints: [
      'Anatomical convention: The right side of the heart appears on your left when viewing anteriorly.',
      'Blue vessels carry deoxygenated blood; red vessels carry freshly oxygenated blood from the lungs.',
      'Valves always allow forward flow and prevent regurgitation back into preceding chambers.',
    ],
    prediction: {
      prompt: 'Which side of the human heart pumps oxygen-rich blood into the body?',
      explanation: 'The left side (left atrium and thick left ventricle) receives oxygenated blood from the lungs and pumps it to the rest of the body.',
      options: [
        { id: 'opt_left', label: 'Left Side (Left Atrium & Left Ventricle)', isCorrect: true },
        { id: 'opt_right', label: 'Right Side (Right Atrium & Right Ventricle)', isCorrect: false },
        { id: 'opt_both', label: 'Both sides equally mix oxygenated and deoxygenated blood', isCorrect: false },
      ],
    },
  },
  briefing: {
    title: 'The Human Heart Anatomy Laboratory',
    objective: 'Explore the four chambers, four valves, and major vessels to master the pathway of cardiac circulation.',
    context: 'The human heart is an astonishing muscular pump beating ~100,000 times a day, maintaining unidirectional double circulation.',
    targetOutcome: 'Demonstrate functional comprehension of cardiac chambers, valves, and blood flow pathways.',
    hints: [
      'Rotate freely in 3D to view anterior, posterior, and lateral cardiac surfaces.',
      'Click the Blood Flow mode to watch illuminated particles trace the path of circulation.',
      'Answer contextual anatomical challenges to lock in your mastery.',
    ],
  },
};

export const HEART_ANATOMY_QUEST = {
  id: 'quest_heart_anatomy_01',
  conceptId: 'human_heart_anatomy',
  conceptName: 'Human Heart Anatomy & Blood Flow',
  prompt: 'Through which heart valve does oxygenated blood pass from the left atrium into the left ventricle?',
  options: [
    'Tricuspid Valve',
    'Mitral (Bicuspid) Valve',
    'Pulmonary Semilunar Valve',
    'Aortic Semilunar Valve',
  ],
  correctIndex: 1,
  explanation: 'The mitral (or bicuspid) valve separates the left atrium from the left ventricle, preventing backflow during systole.',
  difficulty: 0.3,
  experienceType: 'HEART_ANATOMY_EXPLORER',
  experienceId: 'exp_heart_anatomy_01',
  objective: 'Explore the human heart and identify how blood moves through its chambers and valves.',
  briefing: 'Enter the 3D cardiac laboratory. Manipulate and inspect the 4 chambers, 4 valves, and major vessels to discover the mechanics of human circulation.',
  items: [
    {
      id: 'item_heart_anatomy_exp',
      type: 'interactive_simulation',
      title: 'Interactive Lab: Human Heart Explorer',
      description: 'Rotate and inspect 3D heart chambers and valves, observe blood flow, and solve anatomical challenges.',
      concept: 'human_heart_anatomy',
      points: 100,
      experienceType: 'HEART_ANATOMY_EXPLORER',
      experienceConfig: HEART_ANATOMY_EXPERIENCE,
    },
    {
      id: 'item_heart_reflection',
      type: 'reflection',
      title: 'Cardiovascular Function Debrief',
      description: 'Reflect on ventricular muscle thickness, valve mechanics, and dual circulation.',
      concept: 'human_heart_anatomy',
      points: 50,
      question:
        'Why does the left ventricle have significantly thicker muscular walls than the right ventricle?',
    },
  ],
  experienceConfig: HEART_ANATOMY_EXPERIENCE,
};

/**
 * Creates canonical ExperienceResult for the Heart Anatomy Explorer.
 */
export function createHeartExperienceResult(
  config: ExperienceConfig,
  observation: XiraExperienceObservation,
  state: HeartAnatomyState,
  timeSpentSeconds: number = 45
): ExperienceResult {
  const exploredCount = state.inspectedStructures.length;
  const challengeResults = Object.values(state.challengeAnswers);
  const correctChallenges = challengeResults.filter((a) => a.isCorrect).length;
  const isComplete = state.isComplete || (exploredCount >= 4 && (state.flowCompleted || correctChallenges >= 2));

  const score = isComplete
    ? Math.min(100, 70 + correctChallenges * 15)
    : Math.max(20, exploredCount * 10);

  const evidenceSignals: string[] = [];
  if (isComplete) {
    evidenceSignals.push('Demonstrated comprehensive grasp of cardiac chambers and valves');
  }
  if (state.flowCompleted) {
    evidenceSignals.push('Successfully traced entire 12-step cardiovascular blood flow circuit');
  }
  if (correctChallenges >= 2) {
    evidenceSignals.push(`Solved ${correctChallenges} interactive structural challenges`);
  }
  if (exploredCount >= 8) {
    evidenceSignals.push('Thoroughly explored major vessels, chambers, and semilunar valves');
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
    totalInteractions: observation.totalInteractions ?? exploredCount + challengeResults.length,
    timeSpentSeconds,
    timestamp: Date.now(),
    xiraObservation: observation,
    anatomyEvidence: {
      structuresExplored: [...state.inspectedStructures],
      structuresIdentified: Object.keys(state.challengeAnswers).filter((k) => state.challengeAnswers[k].isCorrect),
      flowStepsCompleted: state.flowStepIndex,
      flowErrors: state.flowErrors,
      challengeScore: correctChallenges,
      challengeAttempts: challengeResults.length,
      isFlowComplete: state.flowCompleted,
      isComplete,
    },
    summaryFeedback: isComplete
      ? `Cardiac anatomy mastered! You explored ${exploredCount} structures and demonstrated comprehension of systemic and pulmonary circulation.`
      : `Exploration in progress: ${exploredCount} of 12 structures inspected. Trace the blood flow sequence to complete the lab.`,
    nextActionRecommendation: isComplete
      ? 'Advance to cardiovascular physiology and pulmonary gas exchange dynamics.'
      : 'Continue exploring the remaining valves and trace the blood flow path from vena cava to aorta.',
    evidenceSignals,
  };
}
