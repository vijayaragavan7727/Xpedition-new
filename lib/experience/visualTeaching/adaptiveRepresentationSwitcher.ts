/**
 * Xpedition Visual Teaching Mode Engine v1 — Adaptive Representation Switcher
 *
 * Recommends alternate visual representations when learner evidence indicates
 * that the current visual mode is ineffective (e.g., repeated incorrect predictions,
 * excessive hint requests, confusion in spatial orientation).
 *
 * Principle:
 * "The learner does not merely get another question.
 *  The learner receives a DIFFERENT WAY OF SEEING THE SAME CONCEPT."
 */

import { TeachingMode, RepresentationSwitchOption } from './types';

export interface LearnerEvidenceInput {
  currentMode: TeachingMode;
  incorrectPredictionCount: number;
  incorrectChallengeCount: number;
  hintsUsedCount: number;
  timeSpentSeconds: number;
}

export class AdaptiveRepresentationSwitcher {
  /**
   * Determines if representation switching should be triggered.
   */
  static shouldOfferAlternativeRepresentation(evidence: LearnerEvidenceInput): boolean {
    // Struggle threshold: 2+ incorrect attempts OR 2+ hints with 1+ incorrect attempt
    const totalMistakes = evidence.incorrectPredictionCount + evidence.incorrectChallengeCount;
    if (totalMistakes >= 2) return true;
    if (evidence.hintsUsedCount >= 2 && totalMistakes >= 1) return true;
    return false;
  }

  /**
   * Recommends the next best representation mode for the concept.
   */
  static getRecommendedAlternative(
    currentMode: TeachingMode,
    evidence: LearnerEvidenceInput
  ): RepresentationSwitchOption {
    switch (currentMode) {
      case 'FULL_3D':
        return {
          targetMode: 'EXPLODED_VISUAL',
          reason: '3D spatial immersion may be overwhelming. Isolating parts in an exploded view clarifies component relationships.',
          prompt: 'Would you like to see this in an Exploded Component View to inspect each part separately?',
        };

      case 'MOTION_VISUAL':
        return {
          targetMode: 'INTERACTIVE_VISUAL',
          reason: 'Watching the motion sequence did not solidify causality. Direct variable manipulation builds intuitive understanding.',
          prompt: 'Let’s try an Interactive Visual where you directly adjust the variables yourself.',
        };

      case 'EXPLODED_VISUAL':
        return {
          targetMode: 'INTERACTIVE_VISUAL',
          reason: 'Parts are identified, but dynamic behavior is clearer through parameter interaction.',
          prompt: 'Would you like to test how adjusting parameters changes system behavior in real-time?',
        };

      case 'TRANSFORMATION_VISUAL':
        return {
          targetMode: 'MOTION_VISUAL',
          reason: 'Step-by-step sequential breakdown clarifies the transition mechanism.',
          prompt: 'Let’s walk through the transformation step-by-step with guided motion highlights.',
        };

      case 'INTERACTIVE_VISUAL':
      default:
        return {
          targetMode: '2D_FALLBACK',
          reason: 'A structured, high-contrast concept map highlights foundational principles without distraction.',
          prompt: 'Let’s simplify: review the essential relationships in a structured concept breakdown.',
        };
    }
  }
}
