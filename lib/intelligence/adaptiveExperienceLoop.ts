/**
 * Xpedition Intelligence Layer v1 — Adaptive Experience Loop
 *
 * Connects the Experience Engine to the canonical Intelligence Architecture:
 *
 * STUDENT ACTION
 *  ↓
 * EXPERIENCE TELEMETRY
 *  ↓
 * EXPERIENCE OBSERVATION
 *  ↓
 * EXPERIENCE RESULT
 *  ↓
 * LEARNER MODEL UPDATE (recordAttempt / BKT / theta)
 *  ↓
 * ASSESSMENT INTELLIGENCE (Signal: MISCONCEPTION, KNOWLEDGE_GAP, STRONG_MASTERY, etc.)
 *  ↓
 * DECISION ENGINE (Next Best Action: CORRECT_MISCONCEPTION, HARDER_CHALLENGE, etc.)
 *  ↓
 * NEXT EXPERIENCE RESOLVER (Maps Action + Concept -> Registered Experience or fallback)
 *  ↓
 * XIRA PEDAGOGICAL GUIDANCE (Explains the deterministic decision)
 *
 * Guarantees:
 * 1. ZERO LLM calls to decide next action (deterministic intelligence is authoritative).
 * 2. ZERO duplicate learner models, mastery engines, or decision engines.
 * 3. Does not fabricate broad mastery from a single session.
 * 4. Strictly reuses canonical DecisionEngine, contextMapper, and ExperienceRegistry.
 */

import {
  AdaptiveExperienceLoopResult,
  AssessmentResult,
  LearnerState,
  NextBestAction,
  ResolvedExperience,
} from './types';
import { DecisionEngine, defaultDecisionEngine } from './decisionEngine';
import { mapStoreToLearnerState } from './contextMapper';
import { evaluateExperienceAssessment } from './assessment';
import { resolveNextExperience } from '../experience/nextExperienceResolver';
import { resolveNextQuest } from '../experience/nextQuestResolver';
import { defaultXiraExperienceAdvisor } from '../experience/xira/xiraExperienceAdvisor';
import { ExperienceResult, ExperienceLearnerEvidence } from '../experience/types';
import { TelemetryEmitter } from '../experience/telemetry/telemetryEmitter';
import { getStoreData, recordAttempt, Attempt, UserStoreData } from '../store';

export class AdaptiveExperienceLoopService {
  constructor(private decisionEngine: DecisionEngine = defaultDecisionEngine) {}

  /**
   * Processes a completed ExperienceResult through the full canonical intelligence pipeline.
   *
   * @param result Canonical ExperienceResult emitted by the Experience Engine.
   * @param storeData Optional current UserStoreData (useful for testing or server-side hydration).
   */
  processExperienceResult(
    result: ExperienceResult,
    storeData?: Partial<UserStoreData>
  ): AdaptiveExperienceLoopResult {
    const conceptId = result.concept || 'python_debugging_basics';
    const conceptName = result.summary?.conceptName || result.conceptName || 'Core Concept';
    const codeEv = result.codeEvidence;

    // 0. Initialize Telemetry Emitter for adaptive loop events
    const telemetry = new TelemetryEmitter(result.experienceId || 'exp', conceptId, conceptName);

    telemetry.emit('adaptive_loop_started', {
      conceptId,
      experienceType: result.experienceType,
      score: result.score,
      completed: result.completed,
    });

    // 1. Synthesize canonical ExperienceLearnerEvidence
    const evidence: ExperienceLearnerEvidence = {
      conceptId,
      conceptName,
      isSuccess: Boolean(result.completed && (result.score ?? 0) >= 70),
      accuracy: result.completed ? 1.0 : (result.score ?? 0) / 100,
      trialsCount: codeEv?.runs ?? result.evidence?.trials?.length ?? 1,
      confidence: result.evidence?.predictionAccuracy !== undefined && result.evidence.predictionAccuracy >= 1.0 ? 'known' : 'unsure',
      timeSpentSeconds: result.timeSpentSeconds || 30,
      timestamp: Date.now(),
      codeEvidence: codeEv,
      detectedPrinciple: result.evidence?.detectedPrinciple,
      hintsRequested: codeEv?.hintsUsed ?? result.evidence?.hintsRequested ?? 0,
    };

    // 2. Prepare canonical Attempt record
    const specificItemHash = codeEv?.detectedBug
      ? `exp_${conceptId}_bug_${codeEv.detectedBug}`
      : `exp_${conceptId}_challenge`;

    const attempt: Attempt = {
      id: `exp_att_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      conceptId,
      conceptName,
      isCorrect: evidence.isSuccess,
      timestamp: evidence.timestamp,
      confidence: evidence.confidence,
      isSolo: false,
      itemHash: specificItemHash,
    };

    // 3. Update canonical Learner State in store
    let activeStore: UserStoreData;
    if (storeData) {
      // For unit test isolation or server evaluation: simulate store recordAttempt
      activeStore = this.simulateRecordAttempt(storeData, attempt);
    } else if (typeof window !== 'undefined') {
      activeStore = recordAttempt(attempt);
    } else {
      activeStore = this.simulateRecordAttempt(getStoreData(), attempt);
    }

    // 4. Map updated store to canonical LearnerState
    const updatedLearnerState = mapStoreToLearnerState(activeStore, conceptId);

    telemetry.emit('learner_state_updated', {
      conceptId,
      masteryPercentage: updatedLearnerState.masteryPercentage,
      recentAccuracy: updatedLearnerState.recentAccuracy,
      repeatedMistakes: updatedLearnerState.repeatedMistakes,
      forgettingRisk: updatedLearnerState.forgettingRisk,
    });

    // 5. Evaluate deterministic Assessment Intelligence
    const assessment: AssessmentResult = evaluateExperienceAssessment(evidence, updatedLearnerState);

    telemetry.emit('assessment_signal_generated', {
      conceptId,
      signal: assessment.signal,
      confidence: assessment.confidence,
      reason: assessment.reason,
    });

    // 6. Invoke canonical Decision Engine with updated learner state
    // Misconception alignment: if assessment specifically diagnosed MISCONCEPTION or CONFIDENCE_MISALIGNMENT,
    // ensure learnerState carries the appropriate diagnostic flag to activate Decision Engine rules
    const decisionState: LearnerState = {
      ...updatedLearnerState,
      repeatedMistakes: updatedLearnerState.repeatedMistakes || assessment.signal === 'MISCONCEPTION',
      highConfidenceWrong: assessment.signal === 'CONFIDENCE_MISALIGNMENT'
        ? Math.max(1, updatedLearnerState.highConfidenceWrong || 1)
        : updatedLearnerState.highConfidenceWrong,
    };

    const decision: NextBestAction = this.decisionEngine.decideNextAction(decisionState);

    telemetry.emit('next_action_selected', {
      conceptId,
      action: decision.action,
      capability: decision.capability,
      priority: decision.priority,
      reason: decision.reason,
    });

    // 7. Resolve next concrete Experience or safe fallback via NextExperienceResolver
    const nextExperience: ResolvedExperience = resolveNextExperience(
      decision.action,
      conceptId,
      updatedLearnerState
    );

    telemetry.emit('next_experience_resolved', {
      conceptId,
      action: decision.action,
      available: nextExperience.available,
      experienceId: nextExperience.experienceId,
      reason: nextExperience.reason,
    });

    // 8. Resolve next concrete Quest target and route via NextQuestResolver
    const nextQuest = resolveNextQuest({
      action: decision.action,
      conceptId,
      learnerState: updatedLearnerState,
      resolvedExperience: nextExperience,
    });

    telemetry.emit('next_quest_resolved', {
      conceptId,
      action: decision.action,
      questId: nextQuest.questId,
      available: nextQuest.available,
      route: nextQuest.route,
      reason: nextQuest.reason,
    });

    // 9. Generate Xira pedagogical guidance explaining the decision
    const xiraGuidance = defaultXiraExperienceAdvisor.generateAdaptiveNextStepGuidance(
      decision.action,
      assessment.signal,
      conceptName,
      decision.reason
    );

    // 10. Asynchronously persist educational Xira memory for notable diagnostic signals
    if (assessment.signal === 'MISCONCEPTION' || assessment.signal === 'CONFIDENCE_MISALIGNMENT') {
      try {
        const { persistenceManager } = require('../persistence');
        persistenceManager.recordXiraMemory({
          id: `xmem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          conceptId,
          conceptName,
          category: assessment.signal === 'MISCONCEPTION' ? 'recurring_error' : 'confidence_calibration',
          strength: assessment.confidence || 0.8,
          evidenceSummary: assessment.reason || 'Detected learning misconception in practice',
          timestamp: Date.now(),
        }).catch(() => {});
      } catch {
        // ignore in SSR / restricted environments
      }
    }

    return {
      conceptId,
      conceptName,
      updatedLearnerState,
      assessment,
      decision,
      nextExperience,
      nextQuest,
      reason: decision.reason,
      evidence: {
        rawExperienceResult: result,
        runsCount: codeEv?.runs ?? 1,
        hintsUsed: codeEv?.hintsUsed ?? evidence.hintsRequested ?? 0,
        isIndependent: codeEv?.independentCompletion ?? (evidence.hintsRequested === 0 && evidence.isSuccess),
        finalSuccess: evidence.isSuccess,
        correctionCount: codeEv?.correctionCount,
        detectedBug: codeEv?.detectedBug,
      },
      xiraGuidance,
      evaluatedAt: Date.now(),
    };
  }

  /**
   * Helper to simulate recordAttempt on a store clone for tests or SSR.
   */
  private simulateRecordAttempt(
    storeData: Partial<UserStoreData>,
    attempt: Attempt
  ): UserStoreData {
    const clone: UserStoreData = JSON.parse(JSON.stringify(storeData));
    const activeGraph = clone.graphs?.find((g) => g.id === clone.activeGraphId) || clone.graphs?.[0];

    if (activeGraph) {
      activeGraph.attempts = [...(activeGraph.attempts || []), attempt];
      activeGraph.concepts = (activeGraph.concepts || []).map((concept) => {
        if (concept.id === attempt.conceptId) {
          const delta = attempt.isCorrect ? 8 : -4;
          const newMastery = Math.max(0, Math.min(100, (concept.masteryPercentage ?? 0) + delta));
          const newRisk = attempt.isCorrect
            ? Math.max(0.05, (concept.retentionRisk ?? 0.3) - 0.15)
            : Math.min(0.9, (concept.retentionRisk ?? 0.3) + 0.2);

          return {
            ...concept,
            masteryPercentage: newMastery,
            retentionRisk: newRisk,
            ptsSinceCalibration: (concept.ptsSinceCalibration || 0) + (attempt.isCorrect ? 8 : 0),
          };
        }
        return concept;
      });
      clone.attempts = activeGraph.attempts;
      clone.concepts = activeGraph.concepts;
    }

    return clone;
  }
}

// Global canonical singleton instance
export const defaultAdaptiveExperienceLoop = new AdaptiveExperienceLoopService();

/**
 * Convenience helper to process an ExperienceResult through the Adaptive Experience Loop.
 */
export function processAdaptiveExperienceLoop(
  result: ExperienceResult,
  storeData?: Partial<UserStoreData>
): AdaptiveExperienceLoopResult {
  return defaultAdaptiveExperienceLoop.processExperienceResult(result, storeData);
}
