/**
 * Xpedition Experience Engine v1 — Canonical Feedback Contract
 *
 * Defines the standard feedback categories and payload structures
 * rendered in the Experience HUD and Xira advisor panel.
 */

export type FeedbackType =
  | 'SUCCESS'
  | 'CORRECTION'
  | 'HINT'
  | 'ENCOURAGEMENT'
  | 'NEXT_STEP';

export interface CanonicalExperienceFeedback {
  type: FeedbackType;
  message: string;
  suggestedAction?: string;
  observation?: string;
  confidence?: number;
  highlightedElementId?: string;
  pedagogicalInsight?: string;
}

/**
 * Standard factory helper for canonical experience feedback.
 */
export function createExperienceFeedback(
  type: FeedbackType,
  message: string,
  options?: Partial<Omit<CanonicalExperienceFeedback, 'type' | 'message'>>
): CanonicalExperienceFeedback {
  return {
    type,
    message,
    ...options,
  };
}
