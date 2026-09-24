/**
 * Canonical Data-Driven Content for Xpedition Learning Objects
 *
 * Subject: DC Motor, Commutation & Electromagnetism
 * Demonstrates:
 * - 3 Flashcards (DC Motor, Magnetic Force, Quick Check)
 * - 2 Formula Cards (Magnetic Force, Torque)
 * - 6 Sticky Notes (Key Idea, Remember, Try This, Common Mistake, Hint, Think About This)
 *
 * All content is data-driven and adheres to the Learning Object Design System.
 */

import { FlashcardContent, FormulaCardContent, StickyNoteContent } from './types';

// ============================================================================
// 1. DEMO FLASHCARDS
// ============================================================================
export const DEMO_FLASHCARDS: FlashcardContent[] = [
  {
    id: 'fc_dc_motor_01',
    subject: 'PHYSICS',
    cardNumber: '01',
    title: 'DC MOTOR',
    colorTheme: 'navy',
    emblem: 'lightning',
    illustrationUrl: '/images/learning-objects/dc-motor-armature-exact.png',
    illustrationAlt: 'DC Motor Armature and Commutator',
    front: {
      question: 'What happens when current direction reverses?',
      answerPreview: "The motor's rotation reverses.",
    },
    back: {
      answer: 'The direction of rotation reverses.',
      explanation:
        "According to Fleming's Left-Hand Rule, reversing the armature current vector while the external magnetic field remains unchanged flips the Lorentz force on both coil sides, reversing torque.",
      keyTakeaway: 'Current reversal = Torque reversal = Rotational reversal.',
      formulaSnippet: 'F = I · L · B · sin(θ)',
    },
    conceptId: 'dc_motor',
    tags: ['electromagnetism', 'torque', 'rotation'],
    status: 'UNSEEN',
    rotation: -1.2,
  },
  {
    id: 'fc_mag_force_02',
    subject: 'PHYSICS',
    cardNumber: '02',
    title: 'MAGNETIC FORCE',
    colorTheme: 'forest',
    emblem: 'magnet',
    illustrationUrl: '/images/learning-objects/magnetic-force-exact.png',
    illustrationAlt: 'Magnetic Force on Current-Carrying Conductor',
    front: {
      question: 'What determines the force on a current-carrying conductor?',
      answerPreview: 'Current, magnetic field, length and angle.',
    },
    back: {
      answer: 'Current, magnetic field, length, and angle.',
      explanation:
        'The Lorentz force on a conductor is directly proportional to current (I), magnetic flux density (B), active length (L), and the sine of the angle (θ) relative to the field.',
      keyTakeaway: 'Maximum force occurs when conductor is perpendicular (θ = 90°).',
      formulaSnippet: 'F = I · L · B · sin(θ)',
    },
    conceptId: 'dc_motor',
    tags: ['lorentz_force', 'magnetic_field'],
    status: 'UNSEEN',
    rotation: 0.8,
  },
  {
    id: 'fc_quick_check_03',
    subject: 'PHYSICS',
    cardNumber: '03',
    title: 'QUICK CHECK',
    colorTheme: 'terracotta',
    emblem: 'question',
    illustrationUrl: '/images/learning-objects/commutator-core-exact.png',
    illustrationAlt: 'Commutator Rotor Core',
    front: {
      question: 'What keeps torque continuous?',
      answerPreview: 'Commutation.',
    },
    back: {
      answer: 'Commutation.',
      explanation:
        'The split-ring commutator swaps brush connections every 180° of rotation, ensuring current flow inverts at top-dead-center so torque direction never flips backward.',
      keyTakeaway: 'Without commutation, the rotor would stall vertically.',
    },
    conceptId: 'dc_motor',
    tags: ['commutator', 'torque_continuity'],
    status: 'UNSEEN',
    rotation: -0.5,
  },
];

// ============================================================================
// 2. DEMO FORMULA CARDS
// ============================================================================
export const DEMO_FORMULA_CARDS: FormulaCardContent[] = [
  {
    id: 'form_mag_force_01',
    subject: 'PHYSICS',
    cardNumber: 'FORMULA CARD 01',
    title: 'MAGNETIC FORCE',
    formulaTex: 'F = I \\cdot L \\cdot B \\cdot \\sin(\\theta)',
    variables: [
      { symbol: 'F', description: 'Force on conductor', unit: 'N' },
      { symbol: 'I', description: 'Electric current', unit: 'A' },
      { symbol: 'L', description: 'Conductor length', unit: 'm' },
      { symbol: 'B', description: 'Magnetic field flux density', unit: 'T' },
      { symbol: '\\theta', description: 'Angle between conductor & field', unit: 'rad / °' },
    ],
    unit: 'Newtons (N)',
    example: 'When conductor is perpendicular to field (θ = 90°), sin(θ) = 1, achieving maximum force.',
    emblem: 'atom',
    conceptId: 'dc_motor',
    rotation: -0.8,
  },
  {
    id: 'form_torque_02',
    subject: 'PHYSICS',
    cardNumber: 'FORMULA CARD 02',
    title: 'TORQUE',
    formulaTex: '\\tau = F \\cdot r',
    variables: [
      { symbol: '\\tau', description: 'Rotational torque', unit: 'N·m' },
      { symbol: 'F', description: 'Applied tangential force', unit: 'N' },
      { symbol: 'r', description: 'Lever arm / rotor radius', unit: 'm' },
    ],
    unit: 'Newton-meters (N·m)',
    example: 'Dual magnetic forces on opposite arms of coil create a couple generating net torque.',
    emblem: 'atom',
    conceptId: 'dc_motor',
    rotation: 1.2,
  },
];

// ============================================================================
// 3. DEMO STICKY NOTES
// ============================================================================
export const DEMO_STICKY_NOTES: StickyNoteContent[] = [
  {
    id: 'sn_key_idea_01',
    type: 'key_idea',
    color: 'yellow',
    title: 'KEY IDEA',
    content: 'Commutation keeps torque continuous.',
    author: 'Buddy',
    rotation: -2.2,
    conceptId: 'dc_motor',
  },
  {
    id: 'sn_remember_02',
    type: 'remember',
    color: 'green',
    title: 'REMEMBER',
    content: 'Reverse current → reverse rotation.',
    author: 'Classroom',
    rotation: 1.8,
    conceptId: 'dc_motor',
  },
  {
    id: 'sn_try_this_03',
    type: 'try_this',
    color: 'blue',
    title: 'TRY THIS',
    content: 'Predict the motor direction first.',
    author: 'Xira',
    rotation: -1.0,
    conceptId: 'dc_motor',
  },
  {
    id: 'sn_common_mistake_04',
    type: 'common_mistake',
    color: 'pink',
    title: 'COMMON MISTAKE',
    content: 'Do not confuse current direction with magnetic-field direction.',
    author: 'Mentor',
    rotation: 2.4,
    conceptId: 'dc_motor',
  },
  {
    id: 'sn_hint_05',
    type: 'hint',
    color: 'orange',
    title: 'HINT',
    content: 'Think about what changes when current reverses.',
    author: 'Buddy',
    rotation: -1.6,
    conceptId: 'dc_motor',
  },
  {
    id: 'sn_think_06',
    type: 'think_about_this',
    color: 'lavender',
    title: 'THINK ABOUT THIS',
    content: 'What happens at the exact vertical dead point?',
    author: 'Visual Intelligence',
    rotation: 1.5,
    conceptId: 'dc_motor',
  },
];
