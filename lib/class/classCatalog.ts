/**
 * Canonical Class Content Catalog for Unified Learning Sessions
 * Provides verified academic content for real Xpedition concepts.
 */

import { ClassSessionData, ClassStageId, ClassStageMetadata } from './types';

export const CLASS_STAGE_SEQUENCE: ClassStageMetadata[] = [
  {
    id: 'introduce',
    label: 'Introduce',
    stepNumber: 1,
    totalSteps: 13,
    primaryCta: 'Start Class',
    skipLabel: 'Skip intro →',
    canSkip: true,
  },
  {
    id: 'explain',
    label: 'Explain',
    stepNumber: 2,
    totalSteps: 13,
    primaryCta: 'See It in Action',
    skipLabel: 'I know this →',
    canSkip: true,
  },
  {
    id: 'explore',
    label: 'Explore',
    stepNumber: 3,
    totalSteps: 13,
    primaryCta: 'Got It → Predict',
    skipLabel: 'Skip for now →',
    canSkip: true,
  },
  {
    id: 'predict',
    label: 'Predict',
    stepNumber: 4,
    totalSteps: 13,
    primaryCta: 'Confirm Prediction',
    skipLabel: 'Skip prediction →',
    canSkip: true,
  },
  {
    id: 'interact',
    label: 'Interact',
    stepNumber: 5,
    totalSteps: 13,
    primaryCta: 'Fire Cannon',
    skipLabel: 'Skip interaction →',
    canSkip: true,
  },
  {
    id: 'observe',
    label: 'Observe',
    stepNumber: 6,
    totalSteps: 13,
    primaryCta: 'Check Understanding →',
    skipLabel: 'Skip observation →',
    canSkip: true,
  },
  {
    id: 'quick_check',
    label: 'Quick Check',
    stepNumber: 7,
    totalSteps: 13,
    primaryCta: 'Submit Answer',
    skipLabel: 'Skip check →',
    canSkip: true,
  },
  {
    id: 'mission',
    label: 'Mission',
    stepNumber: 8,
    totalSteps: 13,
    primaryCta: 'Start Mission',
    skipLabel: 'Skip mission →',
    canSkip: true,
  },
  {
    id: 'challenge',
    label: 'Challenge',
    stepNumber: 9,
    totalSteps: 13,
    primaryCta: 'Submit Solution',
    skipLabel: 'Skip challenge →',
    canSkip: true,
  },
  {
    id: 'assessment',
    label: 'Assessment',
    stepNumber: 10,
    totalSteps: 13,
    primaryCta: 'Submit Evaluation',
    skipLabel: 'Skip assessment →',
    canSkip: true,
  },
  {
    id: 'feedback',
    label: 'Feedback',
    stepNumber: 11,
    totalSteps: 13,
    primaryCta: 'Claim Rewards →',
    canSkip: false,
  },
  {
    id: 'reward',
    label: 'Reward',
    stepNumber: 12,
    totalSteps: 13,
    primaryCta: 'Next Class →',
    canSkip: false,
  },
  {
    id: 'next_class',
    label: 'Next Class',
    stepNumber: 13,
    totalSteps: 13,
    primaryCta: 'Start Next Class',
    canSkip: false,
  },
];

export const CANONICAL_CLASSES: Record<string, ClassSessionData> = {
  projectile_motion: {
    conceptId: 'projectile_motion',
    conceptName: 'Projectile Motion',
    subject: 'Physics',
    classNumber: 3,
    totalClasses: 7,
    estimatedMinutes: 6,
    xpReward: 120,
    difficulty: 'Foundation',
    modality: 'FULL_3D',
    hook: 'Understand how launch angle and velocity shape parabolic arcs in 2D space.',
    objective: 'Predict trajectory paths and land a projectile on a 45m target under standard Earth gravity.',
    explanation: {
      title: 'The Parabolic Flight Path',
      summary:
        'A projectile moves under two independent motions: constant horizontal velocity (v_x) and accelerated vertical motion due to gravity (g = 9.8 m/s²).',
      keyPrinciple:
        'Maximum horizontal range on level ground occurs at exactly 45° because sin(2θ) reaches its maximum value of 1 at 2 × 45° = 90°.',
      formula: 'R = (v² · sin 2θ) / g',
    },
    prediction: {
      question: 'Assuming no air resistance, which launch angle achieves maximum horizontal range on flat ground?',
      options: [
        {
          id: 'opt_30',
          label: '30°',
          description: 'Flatter arc with high forward speed but insufficient air time.',
          isCorrect: false,
        },
        {
          id: 'opt_45',
          label: '45°',
          description: 'Optimal balance of vertical hang-time and horizontal velocity.',
          isCorrect: true,
        },
        {
          id: 'opt_60',
          label: '60°',
          description: 'High vertical arc with great hang-time but reduced forward speed.',
          isCorrect: false,
        },
      ],
      explanation: 'At 45°, horizontal and vertical velocity components are equal, yielding maximum ground distance.',
    },
    quickCheck: {
      question: 'What happens to the flight time if you double the vertical component of the initial velocity?',
      options: [
        'The flight time remains unchanged',
        'The flight time doubles',
        'The flight time quadruples',
        'The flight time is cut in half',
      ],
      correctIndex: 1,
      explanation: 'Flight time is given by t = 2·v_y / g. Since t is directly proportional to v_y, doubling v_y doubles the time in the air.',
    },
    mission: {
      title: 'Mission: Bullseye at 45m',
      description: 'Hit the target with the projectile. You have 3 attempts.',
      target: '45.0 meters (± 1.5m tolerance)',
      maxAttempts: 3,
      xpBonus: 80,
    },
    challenge: {
      title: 'Challenge: Constrained Velocity',
      description: 'Hit the target at 35m without changing the initial velocity from 20 m/s. Adjust only the angle.',
      constraint: 'Fixed initial velocity = 20.0 m/s',
      xpBonus: 100,
    },
    assessment: {
      questions: [
        {
          id: 'q1',
          prompt: 'Which two complementary launch angles produce the exact same horizontal range for equal initial velocities?',
          options: ['30° and 60°', '20° and 80°', '45° and 55°', '15° and 65°'],
          correctIndex: 0,
          explanation: 'Complementary angles (angles that sum to 90°, like 30° and 60°) produce identical range because sin(2·30°) = sin(60°) = sin(2·60°) = sin(120°).',
        },
        {
          id: 'q2',
          prompt: 'At the apex (highest point) of a projectile trajectory, which statement is true?',
          options: [
            'Total velocity is zero',
            'Vertical velocity is zero, horizontal velocity is non-zero',
            'Acceleration is zero',
            'Horizontal velocity is zero, vertical velocity is maximum',
          ],
          correctIndex: 1,
          explanation: 'At the top of the trajectory, the vertical velocity momentarily ceases (v_y = 0), while horizontal velocity continues unchanged.',
        },
      ],
    },
    nextConcept: {
      conceptId: 'circular_motion',
      conceptName: 'Uniform Circular Motion',
      subject: 'Physics',
      reason: 'You demonstrated strong control of 2D kinematic vectors. Next, explore how centripetal acceleration curves velocity vectors continuously.',
    },
  },

  human_heart_anatomy: {
    conceptId: 'human_heart_anatomy',
    conceptName: 'Human Heart Anatomy',
    subject: 'Biology',
    classNumber: 2,
    totalClasses: 5,
    estimatedMinutes: 8,
    xpReward: 140,
    difficulty: 'Intermediate',
    modality: 'FULL_3D',
    hook: 'Explore the 4-chambered muscular pump that sustains human life through dual-circuit circulation.',
    objective: 'Trace deoxygenated blood through the right atrium to oxygenated discharge via the aorta.',
    explanation: {
      title: 'Dual Circulatory Circuit',
      summary:
        'The heart acts as two coordinated synchronised pumps. The right side powers pulmonary circulation (to the lungs), while the thicker left ventricle powers systemic circulation (to the body).',
      keyPrinciple:
        'Unidirectional blood flow is strictly maintained by four heart valves: tricuspid, pulmonary, mitral (bicuspid), and aortic.',
      formula: 'Cardiac Output = Stroke Volume × Heart Rate',
    },
    prediction: {
      question: 'Why is the muscular wall of the Left Ventricle significantly thicker than that of the Right Ventricle?',
      options: [
        {
          id: 'opt_1',
          label: 'It holds a larger volume of blood',
          description: 'Incorrect: Both ventricles pump the exact same stroke volume.',
          isCorrect: false,
        },
        {
          id: 'opt_2',
          label: 'It must pump against high systemic vascular resistance across the entire body',
          description: 'Correct: Pumping through the systemic circuit requires ~5x higher pressure than the nearby lungs.',
          isCorrect: true,
        },
        {
          id: 'opt_3',
          label: 'It receives oxygen-poor blood directly from the vena cava',
          description: 'Incorrect: The right atrium receives oxygen-poor blood from vena cava.',
          isCorrect: false,
        },
      ],
      explanation: 'The left ventricle pumps against the systemic arterial tree, requiring massive myocardium thickness.',
    },
    quickCheck: {
      question: 'Which valve prevents backflow of blood from the left ventricle into the left atrium during systole?',
      options: ['Tricuspid Valve', 'Mitral (Bicuspid) Valve', 'Aortic Valve', 'Pulmonary Valve'],
      correctIndex: 1,
      explanation: 'The Mitral (Bicuspid) valve anchors between the left atrium and left ventricle.',
    },
    mission: {
      title: 'Mission: Trace Systemic Ejection',
      description: 'Locate and activate the Aortic Arch valve to simulate ventricular systole.',
      target: 'Aorta & Left Ventricle',
      maxAttempts: 3,
      xpBonus: 90,
    },
    challenge: {
      title: 'Challenge: Identify Valve Pathology',
      description: 'Diagnose aortic stenosis based on pressure gradients across the outflow tract.',
      constraint: 'Calculate peak systolic pressure differential',
      xpBonus: 110,
    },
    assessment: {
      questions: [
        {
          id: 'q1',
          prompt: 'Where does deoxygenated blood from the upper body enter the heart?',
          options: ['Superior Vena Cava', 'Pulmonary Vein', 'Inferior Vena Cava', 'Coronary Sinus'],
          correctIndex: 0,
          explanation: 'The Superior Vena Cava drains venous blood from the head, neck, and upper limbs directly into the right atrium.',
        },
      ],
    },
    nextConcept: {
      conceptId: 'cardiac_conduction',
      conceptName: 'Cardiac Conduction & ECG',
      subject: 'Biology',
      reason: 'You understand the mechanical chambers. Next, learn how the SA node and Purkinje fibers generate the rhythmic electrical impulses of an ECG.',
    },
  },

  dc_motor: {
    conceptId: 'dc_motor',
    conceptName: 'DC Electric Motor & Commutation',
    subject: 'Physics',
    classNumber: 4,
    totalClasses: 8,
    estimatedMinutes: 10,
    xpReward: 150,
    difficulty: 'Intermediate',
    modality: 'FULL_3D',
    hook: 'Discover how magnetic forces convert direct current into continuous mechanical rotation via split-ring commutation.',
    objective: 'Predict armature torque and understand how commutator current reversal prevents motor stalling.',
    explanation: {
      title: 'Electromagnetic Torque & Commutation',
      summary:
        'A DC motor converts electrical energy into rotational motion. Current flowing through the coil inside a permanent magnetic field experiences Lorentz forces (F = I·L·B), producing a torque couple.',
      keyPrinciple:
        'The split-ring commutator acts as a mechanical inverter, reversing the direction of current in the coil every 180° so the torque couple continues driving the rotor in the same direction.',
      formula: 'F = I · L · B · sin(θ)   |   τ = 2 · F · r',
    },
    prediction: {
      question: 'What happens to the rotating armature if the split-ring commutator is disabled or removed?',
      options: [
        {
          id: 'opt_stall',
          label: 'The coil stalls vertically and oscillates back and forth',
          description: 'Correct: Without commutation, torque reverses direction after vertical and opposes motion.',
          isCorrect: true,
        },
        {
          id: 'opt_double',
          label: 'The coil rotates at double its original speed',
          description: 'Incorrect: Opposing forces prevent rotation.',
          isCorrect: false,
        },
        {
          id: 'opt_burn',
          label: 'The permanent stator magnets lose their magnetism',
          description: 'Incorrect: Permanent magnets are unaffected.',
          isCorrect: false,
        },
      ],
      explanation: 'Without commutation reversing current every half-turn, the opposing torque halts continuous rotation.',
    },
    quickCheck: {
      question: 'Which component is responsible for reversing the coil current every half-turn in a DC motor?',
      options: ['Permanent Stator Magnets', 'Split-Ring Commutator', 'Axle Drive Shaft', 'Armature Core'],
      correctIndex: 1,
      explanation: 'The split-ring commutator rotates with the axle, switching brush contacts every 180° to keep torque unidirectional.',
    },
    mission: {
      title: 'Mission: Achieve Continuous Rotation',
      description: 'Engage DC current, align stator magnets, and ensure commutator is active to spin the rotor continuously.',
      target: 'Continuous 360° rotation under 5.0A current',
      maxAttempts: 3,
      xpBonus: 100,
    },
    challenge: {
      title: 'Challenge: Commutator Failure Diagnosis',
      description: 'Observe what happens when the commutator is deactivated and calculate the net torque at 90° deflection.',
      constraint: 'Commutator Disabled',
      xpBonus: 120,
    },
    assessment: {
      questions: [
        {
          id: 'q1',
          prompt: 'According to Fleming’s Left-Hand Rule, what do the thumb, first finger, and second finger represent?',
          options: [
            'Thumb = Force, First Finger = Magnetic Field, Second Finger = Current',
            'Thumb = Current, First Finger = Force, Second Finger = Field',
            'Thumb = Resistance, First Finger = Voltage, Second Finger = Current',
            'Thumb = Velocity, First Finger = Acceleration, Second Finger = Mass',
          ],
          correctIndex: 0,
          explanation: 'Thumb points to Motion/Force, Index finger points in the direction of the Field (N to S), Middle finger points along Current (+ to -).',
        },
      ],
    },
    nextConcept: {
      conceptId: 'electromagnetic_induction',
      conceptName: 'Faraday Induction & Generators',
      subject: 'Physics',
      reason: 'You mastered converting electricity into motion. Next, discover how motion generates electricity!',
    },
  },
};

export function getClassData(conceptId: string): ClassSessionData {
  const normalized = (conceptId || '').toLowerCase().trim();

  if (CANONICAL_CLASSES[normalized]) {
    return CANONICAL_CLASSES[normalized];
  }
  if (normalized.includes('motor') || normalized.includes('electric') || normalized.includes('commutat')) {
    return CANONICAL_CLASSES.dc_motor;
  }
  if (normalized.includes('projectile') || normalized.includes('kinematic')) {
    return CANONICAL_CLASSES.projectile_motion;
  }
  if (normalized.includes('heart') || normalized.includes('cardio') || normalized.includes('anatomy')) {
    return CANONICAL_CLASSES.human_heart_anatomy;
  }

  // Default to dc_motor for teaching experience
  return CANONICAL_CLASSES.dc_motor;
}
