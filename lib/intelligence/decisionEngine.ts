/**
 * Xpedition Decision Engine v1
 *
 * Core pedagogical intelligence layer that determines:
 * "What does this learner need next?"
 *
 * Evaluates learner state -> Recommends a LearningAction with a factual reason ->
 * Maps action to Capability -> Resolves cost-aware Provider behind the scenes.
 * External providers remain an invisible implementation detail.
 */

import {
  Capability,
  Decision,
  IntelligenceRequest,
  LearnerState,
  NextBestAction,
  ProviderId,
  ACTION_CATALOG,
} from './types';
import { ProviderRegistry, defaultProviderRegistry } from './providerRegistry';
import { mapStoreToLearnerState } from './contextMapper';
import type { UserStoreData } from '../store';

export class DecisionEngine {
  constructor(private registry: ProviderRegistry = defaultProviderRegistry) {}

  /**
   * Primary Pedagogical Decision Method:
   * Recommends the Next Best Action for the learner based on actual state telemetry.
   */
  decideNextAction(
    learnerState: Partial<LearnerState>,
    userQuery?: string
  ): NextBestAction {
    const query = (userQuery || '').trim().toLowerCase();
    const conceptName = learnerState.currentConceptName || 'Core Concept';
    const conceptId = learnerState.currentConceptId;
    const mastery = learnerState.masteryPercentage ?? 0;
    const recentAccuracy = learnerState.recentAccuracy ?? 1.0;
    const recentMistakes = learnerState.recentMistakeCount ?? 0;
    const daysUntilExam = learnerState.daysUntilExam;

    // 0. Document-Grounded Study & Notes Material
    if (
      query.includes('from my notes') ||
      query.includes('in my pdf') ||
      query.includes('from my pdf') ||
      query.includes('from the textbook') ||
      query.includes('uploaded material') ||
      query.includes('from the document') ||
      query.includes('what does my notes say') ||
      Boolean(learnerState.activeDocumentId)
    ) {
      const docTitle = learnerState.activeDocumentTitle || 'your study material';
      return this.buildAction(
        'DOCUMENT_GROUNDED_QA',
        conceptId,
        conceptName,
        `Grounded study session directly referencing ${docTitle}.`,
        'high',
        'groq'
      );
    }

    // 1. Current Affairs & Web Research
    if (
      query.includes('latest') ||
      query.includes('current affairs') ||
      query.includes('news') ||
      query.includes('recent policy') ||
      query.includes('rbi policy') ||
      query.includes('2025') ||
      query.includes('2026')
    ) {
      return this.buildAction(
        'RESEARCH_TOPIC',
        conceptId,
        conceptName,
        'Current information and source verification are required for this topic.',
        'medium',
        'tavily'
      );
    }

    // 2. Mathematical Calculation & Proof Verification
    if (
      query.includes('solve step by step') ||
      query.includes('derivative') ||
      query.includes('integral') ||
      query.includes('calculate') ||
      query.includes('prove that') ||
      query.includes('equation')
    ) {
      return this.buildAction(
        'MATH_VERIFICATION',
        conceptId,
        conceptName,
        'Step-by-step rigorous calculation and proof verification needed.',
        'medium',
        'groq'
      );
    }

    // 3. Descriptive Writing / Essay Evaluation
    if (
      query.includes('evaluate my essay') ||
      query.includes('review my answer') ||
      query.includes('descriptive writing') ||
      query.includes('essay feedback') ||
      query.includes('upsc answer')
    ) {
      return this.buildAction(
        'WRITING_EXERCISE',
        conceptId,
        conceptName,
        'Qualitative evaluation of your descriptive answer and structure.',
        'high',
        'groq'
      );
    }

    // 4. Repeated Mistakes / High-Confidence Mistakes -> Misconception Correction
    if (
      Boolean(learnerState.repeatedMistakes) ||
      (learnerState.highConfidenceWrong !== undefined && learnerState.highConfidenceWrong >= 1) ||
      (recentMistakes >= 2 && recentAccuracy < 0.4)
    ) {
      const reason = learnerState.highConfidenceWrong
        ? `You were confident on recent questions for ${conceptName} but selected incorrect options. Let's fix this underlying misconception.`
        : `You've missed ${recentMistakes} recent questions on ${conceptName}. Let's address the common confusion before moving on.`;

      return this.buildAction(
        'CORRECT_MISCONCEPTION',
        conceptId,
        conceptName,
        reason,
        'critical',
        'groq'
      );
    }

    // 5. Low-Confidence Correct -> Confidence Reinforcement
    if (learnerState.lowConfidenceCorrect !== undefined && learnerState.lowConfidenceCorrect >= 2) {
      return this.buildAction(
        'CONFIDENCE_REINFORCEMENT',
        conceptId,
        conceptName,
        `You correctly answered recent items on ${conceptName} while unsure. Let's solidify your intuition so you feel confident.`,
        'medium',
        'groq'
      );
    }

    // 6. High Retention Risk (>0.35) -> Spaced Repetition Review
    if (learnerState.forgettingRisk !== undefined && learnerState.forgettingRisk > 0.35) {
      const riskPct = Math.round(learnerState.forgettingRisk * 100);
      return this.buildAction(
        'SPACED_REVIEW',
        conceptId,
        conceptName,
        `You learned ${conceptName} earlier, but retention risk is ${riskPct}%. A quick 5-minute review will lock it in.`,
        'high',
        'groq'
      );
    }

    // 7. Approaching Exam (<= 14 days) -> Exam Mock Assessment
    if (daysUntilExam !== undefined && daysUntilExam <= 14) {
      return this.buildAction(
        'EXAM_MOCK',
        conceptId,
        conceptName,
        `Your exam is in ${daysUntilExam} days. Let's run a timed high-yield assessment on ${learnerState.goalText || 'your syllabus'}.`,
        'high',
        'groq'
      );
    }

    // 8. High Mastery (>=80%) + Strong Accuracy -> Harder Challenge
    if (mastery >= 80 && recentAccuracy >= 0.8) {
      return this.buildAction(
        'HARDER_CHALLENGE',
        conceptId,
        conceptName,
        `You've demonstrated ${mastery}% mastery on ${conceptName} with strong accuracy. Let's test your skills with an advanced challenge.`,
        'medium',
        'groq'
      );
    }

    // 9. Low Mastery (<50%) & Low Accuracy -> Practice / Scaffolding
    if (mastery < 50 && recentAccuracy < 0.6 && !learnerState.isNewLearner) {
      return this.buildAction(
        'PRACTICE_CONCEPT',
        conceptId,
        conceptName,
        `Your current mastery on ${conceptName} is ${mastery}%. A targeted practice quest will build your speed and accuracy.`,
        'high',
        'groq'
      );
    }

    // 10. New Learner / Unstarted Concept -> Learn Concept Introduction
    if (Boolean(learnerState.isNewLearner) || mastery === 0) {
      return this.buildAction(
        'LEARN_CONCEPT',
        conceptId,
        conceptName,
        `Starting fresh on ${conceptName}. Let's introduce the core real-world principles first.`,
        'high',
        'groq'
      );
    }

    // 11. Default Practice / Tutoring Baseline
    return this.buildAction(
      'PRACTICE_CONCEPT',
      conceptId,
      conceptName,
      `Continue building momentum on ${conceptName} (${mastery}% mastery).`,
      'medium',
      'groq'
    );
  }

  /**
   * Request-level decision method for Intelligence Layer execution.
   */
  decide(request: IntelligenceRequest): Decision {
    const nextAction = this.decideNextAction(request.learnerContext || {}, request.query || request.userPrompt);

    return {
      capability: request.requiredCapability || nextAction.capability,
      primaryProvider: request.forceProvider || nextAction.providerDecision.provider,
      reason: nextAction.reason,
      confidence: 0.9,
      fallbackProviders: nextAction.providerDecision.fallbackUsed ? [] : ['groq'],
    };
  }

  private buildAction(
    action: NextBestAction['action'],
    conceptId: string | undefined,
    conceptName: string,
    reason: string,
    priority: NextBestAction['priority'],
    preferredProvider: ProviderId
  ): NextBestAction {
    const actionDef = ACTION_CATALOG[action];
    const capability = actionDef?.defaultCapability || 'tutor';

    // Provider resolution through registry with cost & configuration awareness
    const provider = this.resolveProvider(capability, preferredProvider);

    return {
      action,
      targetConceptId: conceptId,
      targetConceptName: conceptName,
      reason,
      estimatedMinutes: actionDef?.defaultEstimatedMinutes || 8,
      priority,
      capability,
      providerDecision: {
        provider,
        fallbackUsed: provider !== preferredProvider,
      },
    };
  }

  private resolveProvider(capability: Capability, preferred: ProviderId): ProviderId {
    const target = this.registry.get(preferred);
    if (target && target.isConfigured() && target.supports(capability)) {
      return preferred;
    }

    const available = this.registry.getProvidersForCapability(capability);
    for (const pId of available) {
      const p = this.registry.get(pId);
      if (p && p.isConfigured()) {
        return pId;
      }
    }

    return 'groq'; // Safe default baseline
  }
}

export const defaultDecisionEngine = new DecisionEngine();

/**
 * Safe helper for Home and UI surfaces to obtain the Next Best Action
 * from existing UserStoreData without modifying UI or state.
 */
export function getNextBestAction(
  storeData?: Partial<UserStoreData>,
  explicitConceptId?: string
): NextBestAction {
  const learnerState = mapStoreToLearnerState(storeData, explicitConceptId);
  return defaultDecisionEngine.decideNextAction(learnerState);
}
