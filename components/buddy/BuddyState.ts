/**
 * Buddy State Model
 * Explicit state definitions, visual characteristics, and transitions
 * for the visible AI companion.
 *
 * Rule: Buddy manages presence, emotional reactions, and visual guidance.
 * Buddy NEVER owns or determines mastery, difficulty, or progression.
 */

import { XP_COLORS } from '../../lib/design-system/tokens';

export type BuddyState =
  | 'IDLE'
  | 'INTRODUCING'
  | 'EXPLAINING'
  | 'THINKING'
  | 'ENCOURAGING'
  | 'CELEBRATING'
  | 'CORRECT'
  | 'INCORRECT'
  | 'HINTING'
  | 'WAITING'
  | 'TRANSITIONING'
  | 'COMPLETE';

export type BuddyEyeExpression =
  | 'normal'     // Dual horizontal rounded bars / energetic dots
  | 'happy'      // Upward crescent arcs ^ ^
  | 'thinking'   // Asymmetric question / squinting glance
  | 'observing'  // Wide focused apertures
  | 'supportive' // Gentle downward soften
  | 'celebrating'// Radiant pulsing stars/sparkles
  | 'quiet';     // Subdued minimal glow (for assessment)

export interface BuddyStateMeta {
  state: BuddyState;
  label: string;
  description: string;
  visorColor: string;
  glowColor: string;
  eyeExpression: BuddyEyeExpression;
  pulseRate: number; // in Hz
  bobAmplitude: number;
  rotationIntensity: number;
  speechAllowed: boolean;
  assessmentSafe: boolean; // True if this state will not bias the learner during test/assessment
}

export const BUDDY_STATE_CONFIG: Record<BuddyState, BuddyStateMeta> = {
  IDLE: {
    state: 'IDLE',
    label: 'Resting Companion',
    description: 'Subtle ambient breathing and levitation awaiting learner interaction.',
    visorColor: XP_COLORS.ai.buddy.accent, // #38BDF8 (Cyan)
    glowColor: 'rgba(56, 189, 248, 0.25)',
    eyeExpression: 'normal',
    pulseRate: 1.0,
    bobAmplitude: 0.08,
    rotationIntensity: 0.05,
    speechAllowed: true,
    assessmentSafe: true,
  },
  INTRODUCING: {
    state: 'INTRODUCING',
    label: 'Introducing Topic',
    description: 'Energetic greeting posture welcoming learner to the new lesson.',
    visorColor: '#38BDF8',
    glowColor: 'rgba(56, 189, 248, 0.45)',
    eyeExpression: 'happy',
    pulseRate: 2.0,
    bobAmplitude: 0.12,
    rotationIntensity: 0.15,
    speechAllowed: true,
    assessmentSafe: true,
  },
  EXPLAINING: {
    state: 'EXPLAINING',
    label: 'Guiding Concept',
    description: 'Focused posture gesturing toward core learning materials.',
    visorColor: '#818CF8', // Indigo accent matching explanation
    glowColor: 'rgba(129, 140, 248, 0.35)',
    eyeExpression: 'observing',
    pulseRate: 1.5,
    bobAmplitude: 0.06,
    rotationIntensity: 0.08,
    speechAllowed: true,
    assessmentSafe: true,
  },
  THINKING: {
    state: 'THINKING',
    label: 'Analyzing / Prompting',
    description: 'Inquisitive head tilt encouraging learner to hypothesize or predict.',
    visorColor: '#F59E0B', // Amber
    glowColor: 'rgba(245, 158, 11, 0.35)',
    eyeExpression: 'thinking',
    pulseRate: 1.8,
    bobAmplitude: 0.05,
    rotationIntensity: 0.2,
    speechAllowed: true,
    assessmentSafe: true,
  },
  ENCOURAGING: {
    state: 'ENCOURAGING',
    label: 'Encouraging Effort',
    description: 'Warm, positive nod cheering on the learner.',
    visorColor: '#10B981', // Emerald
    glowColor: 'rgba(16, 185, 129, 0.35)',
    eyeExpression: 'supportive',
    pulseRate: 1.4,
    bobAmplitude: 0.1,
    rotationIntensity: 0.06,
    speechAllowed: true,
    assessmentSafe: true,
  },
  CELEBRATING: {
    state: 'CELEBRATING',
    label: 'Mastery Celebration',
    description: 'High-energy celebratory spins and bursts on milestone completion.',
    visorColor: '#F43F5E', // Vibrant rose / gold
    glowColor: 'rgba(244, 63, 94, 0.5)',
    eyeExpression: 'celebrating',
    pulseRate: 3.5,
    bobAmplitude: 0.22,
    rotationIntensity: 0.4,
    speechAllowed: true,
    assessmentSafe: true,
  },
  CORRECT: {
    state: 'CORRECT',
    label: 'Validated',
    description: 'Brief, crisp affirmation on correct response or prediction.',
    visorColor: '#10B981', // Emerald
    glowColor: 'rgba(16, 185, 129, 0.45)',
    eyeExpression: 'happy',
    pulseRate: 2.2,
    bobAmplitude: 0.16,
    rotationIntensity: 0.1,
    speechAllowed: true,
    assessmentSafe: true,
  },
  INCORRECT: {
    state: 'INCORRECT',
    label: 'Reflecting',
    description: 'Gentle, supportive, non-judgmental posture inviting another try.',
    visorColor: '#F59E0B', // Warm amber (never alarming red)
    glowColor: 'rgba(245, 158, 11, 0.3)',
    eyeExpression: 'supportive',
    pulseRate: 1.2,
    bobAmplitude: 0.06,
    rotationIntensity: 0.12,
    speechAllowed: true,
    assessmentSafe: true,
  },
  HINTING: {
    state: 'HINTING',
    label: 'Offering Perspective',
    description: 'Attentive posture offering a gentle nudge or angle to consider.',
    visorColor: '#818CF8', // Indigo
    glowColor: 'rgba(129, 140, 248, 0.3)',
    eyeExpression: 'thinking',
    pulseRate: 1.6,
    bobAmplitude: 0.07,
    rotationIntensity: 0.14,
    speechAllowed: true,
    assessmentSafe: true,
  },
  WAITING: {
    state: 'WAITING',
    label: 'Attentive Waiting',
    description: 'Calm ambient hovering giving learner full agency over the canvas.',
    visorColor: '#38BDF8',
    glowColor: 'rgba(56, 189, 248, 0.2)',
    eyeExpression: 'observing',
    pulseRate: 0.9,
    bobAmplitude: 0.06,
    rotationIntensity: 0.03,
    speechAllowed: false,
    assessmentSafe: true,
  },
  TRANSITIONING: {
    state: 'TRANSITIONING',
    label: 'Transitioning Stage',
    description: 'Forward directional motion gliding to the next stage.',
    visorColor: '#6366F1',
    glowColor: 'rgba(99, 102, 241, 0.3)',
    eyeExpression: 'normal',
    pulseRate: 1.8,
    bobAmplitude: 0.14,
    rotationIntensity: 0.18,
    speechAllowed: false,
    assessmentSafe: true,
  },
  COMPLETE: {
    state: 'COMPLETE',
    label: 'Class Completed',
    description: 'Relaxed triumphant posture signaling success.',
    visorColor: '#10B981',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    eyeExpression: 'happy',
    pulseRate: 1.2,
    bobAmplitude: 0.09,
    rotationIntensity: 0.05,
    speechAllowed: true,
    assessmentSafe: true,
  },
};

/**
 * Maps unified Class stages to the canonical Buddy companion state.
 * Enforces that during ASSESSMENT stage, Buddy is silent and non-leading.
 */
export function getBuddyStateForClassStage(stageId: string): BuddyState {
  switch (stageId) {
    case 'introduce':
      return 'INTRODUCING';
    case 'explain':
      return 'EXPLAINING';
    case 'explore':
      return 'WAITING';
    case 'predict':
      return 'THINKING';
    case 'interact':
      return 'WAITING';
    case 'observe':
      return 'ENCOURAGING';
    case 'quick_check':
      return 'WAITING';
    case 'mission':
      return 'ENCOURAGING';
    case 'challenge':
      return 'THINKING';
    case 'assessment':
      // CRITICAL: Buddy must be quiet during assessment to avoid biasing or distracting
      return 'WAITING';
    case 'feedback':
      return 'EXPLAINING';
    case 'reward':
      return 'CELEBRATING';
    case 'next_class':
      return 'TRANSITIONING';
    default:
      return 'IDLE';
  }
}
