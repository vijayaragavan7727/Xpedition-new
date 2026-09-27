/**
 * Xira Classroom Orchestrator (Phase 4, Steps 3, 5, 6, 10, 11, 13, 14, 18, 21)
 *
 * Master intelligence layer coordinating the interactive classroom experience:
 * - Classroom stage transitions & session management
 * - Visual Intelligence integration (VisualRequirementEngine)
 * - Buddy companion dialogues & state synchronization
 * - Student interaction and diagnostic question evaluation
 * - Deterministic mastery scoring & adaptive interventions
 * - Comprehensive error fallback hierarchy
 */

import {
  ClassroomStage,
  ClassroomSessionState,
  ClassroomLearnerAction,
  ClassroomMasteryLevel,
  mapClassroomStageToVisualStage,
} from './classroomSessionTypes';
import { classroomStageController } from './classroomStageController';
import { classroomTelemetry, ClassroomTelemetryService } from './classroomTelemetry';
import {
  visualRequirementEngine,
  VisualRequirementEngine,
} from '../visualIntelligence/VisualRequirementEngine';
import {
  VisualRequirement,
  SmartBoardVisualPayload,
} from '../visualIntelligence/types';
import { BuddyState } from '@/components/buddy/BuddyState';
import { ClassroomLesson } from '@/components/classroom/types';
import { getClassroomSessionStore, IClassroomSessionStore } from './ClassroomSessionStore';
import { resolveClassLesson } from '../concepts/lessonResolver';
import { getNextConceptId } from '../concepts/conceptRegistry';

/** Thrown when a session is requested for a concept that is not in the registry. */
export class ConceptUnavailableError extends Error {
  constructor(public readonly requestedConceptId: string) {
    super(`Concept is not available: ${requestedConceptId.slice(0, 100)}`);
    this.name = 'ConceptUnavailableError';
  }
}

/** Thrown when a session would be created without an authenticated owner. */
export class SessionOwnerRequiredError extends Error {
  constructor() {
    super('An authenticated owner is required to create a classroom session');
    this.name = 'SessionOwnerRequiredError';
  }
}

/** Thrown when a session does not exist OR belongs to another learner (not distinguished, by design). */
export class SessionNotFoundError extends Error {
  constructor() {
    super('Classroom session not found');
    this.name = 'SessionNotFoundError';
  }
}

function newSessionId(): string {
  const cryptoApi = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (cryptoApi?.randomUUID) return `sess_${cryptoApi.randomUUID()}`;
  return `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
}

export class XiraClassroomOrchestrator {
  private static instance: XiraClassroomOrchestrator;
  private readonly sessions: Map<string, ClassroomSessionState> = new Map();
  private readonly sessionStore: IClassroomSessionStore;
  private readonly telemetryService: ClassroomTelemetryService;
  private readonly reqEngine: VisualRequirementEngine;

  constructor(
    telemetry: ClassroomTelemetryService = classroomTelemetry,
    engine: VisualRequirementEngine = visualRequirementEngine,
    sessionStore: IClassroomSessionStore = getClassroomSessionStore()
  ) {
    this.telemetryService = telemetry;
    this.reqEngine = engine;
    this.sessionStore = sessionStore;
  }

  public static getInstance(): XiraClassroomOrchestrator {
    if (!XiraClassroomOrchestrator.instance) {
      XiraClassroomOrchestrator.instance = new XiraClassroomOrchestrator();
    }
    return XiraClassroomOrchestrator.instance;
  }

  /**
   * Initializes a new stateful classroom session.
   */
  public async createSession(
    conceptId: string,
    initialStage: ClassroomStage = 'INTRODUCE',
    options: { ownerId?: string; intent?: string } = {}
  ): Promise<ClassroomSessionState> {
    // Single authoritative resolver: unknown concepts are refused, never substituted.
    // Authorization: every session belongs to exactly one authenticated learner.
    if (typeof options.ownerId !== 'string' || options.ownerId.trim().length === 0) {
      throw new SessionOwnerRequiredError();
    }
    const resolution = resolveClassLesson(conceptId, options.intent);
    if (resolution.status !== 'resolved') {
      throw new ConceptUnavailableError(conceptId);
    }
    const lesson: ClassroomLesson = resolution.lesson;
    const sessionId = newSessionId();

    // 1. Initial Visual Requirement & Smart Board Payload
    let currentVisualRequirement: VisualRequirement | undefined;
    let currentVisualPayload: SmartBoardVisualPayload | undefined;
    let visualError: string | undefined;

    try {
      currentVisualRequirement = await this.reqEngine.evaluateVisualRequirement({
        conceptId: lesson.conceptId,
        subject: lesson.subject,
        topic: lesson.topicTitle,
        learningObjective: lesson.learningObjective,
        stage: mapClassroomStageToVisualStage(initialStage),
        allowGeneration: false, // Default to deterministic/cached visuals
      });
      currentVisualPayload = this.reqEngine.formatSmartBoardPayload(currentVisualRequirement);
    } catch (err: any) {
      visualError = err?.message || 'Visual evaluation fallback active';
      currentVisualPayload = this.buildSafeVisualFallback(lesson, initialStage);
    }

    const { dialogue, state } = this.resolveBuddyReaction(initialStage, lesson, 0);

    const sessionState: ClassroomSessionState = {
      sessionId,
      conceptId: lesson.conceptId,
      lessonId: lesson.id,
      topicTitle: lesson.topicTitle,
      subject: lesson.subject,
      currentStage: initialStage,
      stageIndex: classroomStageController.getStageIndex(initialStage),
      stageStartedAt: Date.now(),
      currentVisualRequirement,
      currentVisualPayload,
      interactionState: {
        hasInteracted: false,
        interactionCount: 0,
        parameters: {},
      },
      questionState: {
        activeQuestion: lesson.questions && lesson.questions.length > 0 ? lesson.questions[0] : undefined,
        attemptNumber: 0,
        isSubmitted: false,
        retryAllowed: true,
      },
      masteryState: 'NOT_STARTED',
      masteryScore: 10,
      telemetry: [],
      completedStages: [],
      buddyDialogue: dialogue,
      buddyState: state,
      isVisualLoading: false,
      visualError,
      nextRecommendedConceptId: getNextConceptId(lesson.conceptId) ?? undefined,
      intent: resolution.intent,
      ownerId: options.ownerId,
    };

    this.sessions.set(sessionId, sessionState);
    await this.sessionStore.saveSession(sessionState, options.ownerId);

    // Record initial telemetry
    this.telemetryService.recordEvent({
      sessionId,
      conceptId: lesson.conceptId,
      stage: initialStage,
      type: 'CLASS_STARTED',
      data: { lessonId: lesson.id },
    });

    this.telemetryService.recordEvent({
      sessionId,
      conceptId: lesson.conceptId,
      stage: initialStage,
      type: 'STAGE_STARTED',
      data: { stageIndex: sessionState.stageIndex },
    });

    return sessionState;
  }

  /**
   * Retrieves active session by ID.
   */
  /**
   * Reads a session for its owner only. Anonymous or non-owner reads return null
   * (indistinguishable from "not found"); a random session id is not a credential.
   */
  public async getSession(sessionId: string, requesterId: string): Promise<ClassroomSessionState | null> {
    if (!requesterId) return null;
    let session = this.sessions.get(sessionId) || null;
    if (!session) {
      session = await this.sessionStore.getSession(sessionId, requesterId);
    }
    if (!session || !session.ownerId || session.ownerId !== requesterId) return null;
    return { ...session };
  }

  /**
   * Processes a learner action and coordinates classroom state evolution.
   */
  public async processLearnerAction(
    sessionId: string,
    action: ClassroomLearnerAction,
    requesterId: string
  ): Promise<ClassroomSessionState> {
    // Authorization first: no requester, no access. Sessions without an owner
    // (legacy/corrupt) are never mutable.
    if (typeof requesterId !== 'string' || !requesterId) {
      throw new SessionNotFoundError();
    }
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = (await this.sessionStore.getSession(sessionId, requesterId)) || undefined;
      if (session && session.ownerId === requesterId) {
        this.sessions.set(sessionId, session);
      }
    }
    if (!session || !session.ownerId || session.ownerId !== requesterId) {
      throw new SessionNotFoundError();
    }

    const resolution = resolveClassLesson(session.conceptId);
    if (resolution.status !== 'resolved') {
      throw new ConceptUnavailableError(session.conceptId);
    }
    const lesson: ClassroomLesson = resolution.lesson;

    switch (action.type) {
      case 'ADVANCE_STAGE': {
        const nextStage = classroomStageController.getNextStage(session.currentStage, {
          forceNextInSequence: true,
        });
        return await this.transitionToStage(session, nextStage, lesson);
      }

      case 'PREVIOUS_STAGE': {
        const prevStage = classroomStageController.getPreviousStage(session.currentStage);
        return await this.transitionToStage(session, prevStage, lesson);
      }

      case 'INTERACT_VISUAL': {
        session.interactionState.hasInteracted = true;
        session.interactionState.interactionCount += 1;
        session.interactionState.lastInteractionType = action.interactionType;
        if (action.payload) {
          session.interactionState.parameters = {
            ...session.interactionState.parameters,
            ...action.payload,
          };
        }

        this.telemetryService.recordEvent({
          sessionId,
          conceptId: session.conceptId,
          stage: session.currentStage,
          type: 'VISUAL_INTERACTED',
          data: { interactionType: action.interactionType },
        });

        // Boost mastery for active exploratory engagement
        session.masteryScore = Math.min(100, session.masteryScore + 5);
        session.masteryState = this.calculateMasteryLevel(session.masteryScore);

        return { ...session };
      }

      case 'ANSWER_QUESTION': {
        const question = session.questionState.activeQuestion;
        session.questionState.selectedOptionId = action.optionId;
        session.questionState.isSubmitted = true;
        session.questionState.attemptNumber += 1;

        let isCorrect = false;
        let misconception: string | undefined;

        if (question) {
          const selected = question.options.find((o) => o.id === action.optionId);
          isCorrect = Boolean(selected?.isCorrect);
          if (!isCorrect && question.misconceptionTag) {
            misconception = question.misconceptionTag;
            session.questionState.misconceptionDetected = misconception;
          }
        }

        session.questionState.isCorrect = isCorrect;

        this.telemetryService.recordEvent({
          sessionId,
          conceptId: session.conceptId,
          stage: session.currentStage,
          type: 'QUESTION_ANSWERED',
          data: {
            questionId: question?.id,
            isCorrect,
            optionId: action.optionId,
            attemptNumber: session.questionState.attemptNumber,
            misconception,
          },
        });

        if (isCorrect) {
          this.telemetryService.recordEvent({
            sessionId,
            conceptId: session.conceptId,
            stage: session.currentStage,
            type: 'ANSWER_CORRECT',
            data: { attemptNumber: session.questionState.attemptNumber },
          });

          session.masteryScore = Math.min(100, session.masteryScore + 20);
          session.masteryState = this.calculateMasteryLevel(session.masteryScore);

          session.xiraIntervention = {
            type: 'praise',
            title: 'Mastery Confirmed',
            message: lesson.buddyScript?.correct ?? 'Correct.',
            actionLabel: 'Continue to Practice',
          };

          return await this.transitionToStage(session, 'FEEDBACK', lesson, { isCorrect: true });
        } else {
          this.telemetryService.recordEvent({
            sessionId,
            conceptId: session.conceptId,
            stage: session.currentStage,
            type: 'ANSWER_INCORRECT',
            data: { misconception },
          });

          session.masteryScore = Math.max(0, session.masteryScore - 5);
          session.masteryState = this.calculateMasteryLevel(session.masteryScore);

          const misconceptionExplanation = this.getMisconceptionAdvice(misconception, question?.explanation, lesson);
          session.xiraIntervention = {
            type: 'misconception',
            title: 'Mental Model Adjustment',
            message: misconceptionExplanation,
            actionLabel: 'Retry Question',
          };

          return await this.transitionToStage(session, 'FEEDBACK', lesson, { isCorrect: false });
        }
      }

      case 'RETRY_QUESTION': {
        session.questionState.isSubmitted = false;
        session.questionState.selectedOptionId = undefined;
        session.questionState.isCorrect = undefined;

        this.telemetryService.recordEvent({
          sessionId,
          conceptId: session.conceptId,
          stage: 'QUESTION',
          type: 'RETRY_REQUESTED',
        });

        return await this.transitionToStage(session, 'QUESTION', lesson, { retry: true });
      }

      case 'REQUEST_HINT': {
        this.telemetryService.recordEvent({
          sessionId,
          conceptId: session.conceptId,
          stage: session.currentStage,
          type: 'HINT_REQUESTED',
        });

        const activeQ = session.questionState.activeQuestion;
        const hintText =
          activeQ?.hint?.hints?.[0] ||
          lesson.buddyScript?.hint ||
          lesson.steps[0]?.hintText ||
          `Re-read the key idea for ${lesson.topicTitle} on the Smart Board.`;

        session.xiraIntervention = {
          type: 'hint',
          title: 'Targeted Guidance',
          message: hintText,
          actionLabel: 'Got It',
        };

        return { ...session };
      }

      case 'COMPLETE_CHALLENGE': {
        const isSuccess = action.outcome === 'success';
        this.telemetryService.recordEvent({
          sessionId,
          conceptId: session.conceptId,
          stage: 'CHALLENGE',
          type: 'CHALLENGE_COMPLETED',
          data: { outcome: action.outcome },
        });

        if (isSuccess) {
          session.masteryScore = Math.min(100, session.masteryScore + 25);
        } else {
          session.masteryScore = Math.min(100, session.masteryScore + 10);
        }
        session.masteryState = this.calculateMasteryLevel(session.masteryScore);

        return await this.transitionToStage(session, 'ASSESS', lesson);
      }

      case 'COMPLETE_ASSESSMENT': {
        this.telemetryService.recordEvent({
          sessionId,
          conceptId: session.conceptId,
          stage: 'ASSESS',
          type: 'ASSESSMENT_COMPLETED',
          data: { isCorrect: action.isCorrect },
        });

        if (action.isCorrect) {
          session.masteryScore = Math.min(100, session.masteryScore + 20);
        }
        session.masteryState = this.calculateMasteryLevel(session.masteryScore);

        return await this.transitionToStage(session, 'REWARD', lesson);
      }

      case 'CLAIM_REWARD': {
        this.telemetryService.recordEvent({
          sessionId,
          conceptId: session.conceptId,
          stage: 'REWARD',
          type: 'REWARD_GRANTED',
          data: { finalMastery: session.masteryScore },
        });

        this.telemetryService.recordEvent({
          sessionId,
          conceptId: session.conceptId,
          stage: 'NEXT',
          type: 'CLASS_COMPLETED',
        });

        return await this.transitionToStage(session, 'NEXT', lesson);
      }

      case 'SELECT_NEXT_CONCEPT': {
        session.nextRecommendedConceptId = action.nextConceptId;
        return { ...session };
      }

      default:
        return session;
    }
  }

  /**
   * Internal coordinator handling stage transitions and visual requirement updates.
   */
  private async transitionToStage(
    session: ClassroomSessionState,
    targetStage: ClassroomStage,
    lesson: ClassroomLesson,
    context: { isCorrect?: boolean; retry?: boolean } = {}
  ): Promise<ClassroomSessionState> {
    const prevStage = session.currentStage;
    if (!session.completedStages.includes(prevStage)) {
      session.completedStages.push(prevStage);
    }

    session.currentStage = targetStage;
    session.stageIndex = classroomStageController.getStageIndex(targetStage);
    session.stageStartedAt = Date.now();

    // Re-evaluate Visual Intelligence for new stage
    try {
      session.currentVisualRequirement = await this.reqEngine.evaluateVisualRequirement({
        conceptId: lesson.conceptId,
        subject: lesson.subject,
        topic: lesson.topicTitle,
        learningObjective: lesson.learningObjective,
        stage: mapClassroomStageToVisualStage(targetStage),
        allowGeneration: false,
      });
      session.currentVisualPayload = this.reqEngine.formatSmartBoardPayload(session.currentVisualRequirement);
      session.visualError = undefined;
    } catch (err: any) {
      session.visualError = err?.message || 'Visual requirement fallback';
      session.currentVisualPayload = this.buildSafeVisualFallback(lesson, targetStage);
    }

    // Resolve Buddy dialogue and animation state
    const { dialogue, state } = this.resolveBuddyReaction(
      targetStage,
      lesson,
      session.stageIndex,
      context
    );
    session.buddyDialogue = dialogue;
    session.buddyState = state;

    // Record Telemetry
    this.telemetryService.recordEvent({
      sessionId: session.sessionId,
      conceptId: session.conceptId,
      stage: targetStage,
      type: 'STAGE_STARTED',
      data: { fromStage: prevStage, stageIndex: session.stageIndex },
    });

    this.sessions.set(session.sessionId, session);
    await this.sessionStore.saveSession(session, session.ownerId);

    return { ...session };
  }

  /**
   * Buddy reaction for a stage. All wording comes from the ACTIVE lesson:
   * its Buddy script and its own step dialogue. No concept-specific defaults.
   */
  private resolveBuddyReaction(
    stage: ClassroomStage,
    lesson: ClassroomLesson,
    stepIdx: number,
    context: { isCorrect?: boolean; retry?: boolean } = {}
  ): { dialogue: string; state: BuddyState } {
    const script = lesson.buddyScript;
    const steps = lesson.steps;
    const stepAt = (i: number) => steps[Math.max(0, Math.min(steps.length - 1, i))];
    switch (stage) {
      case 'INTRODUCE':
        return { dialogue: script?.introduction ?? stepAt(0).buddyDialogue, state: 'INTRODUCING' };
      case 'EXPLAIN':
        return { dialogue: stepAt(1).buddyDialogue, state: 'EXPLAINING' };
      case 'DEMONSTRATE':
        return { dialogue: stepAt(2).buddyDialogue, state: 'EXPLAINING' };
      case 'INTERACT': {
        const interactStep = steps.find((s) => s.stage === 'interact') ?? stepAt(3);
        return { dialogue: interactStep.buddyDialogue, state: 'ENCOURAGING' };
      }
      case 'QUESTION': {
        const questionStep = steps.find((s) => s.checkQuestion) ?? stepAt(stepIdx);
        const prompt = questionStep.checkQuestion ? `Predict: ${questionStep.checkQuestion.prompt}` : questionStep.buddyDialogue;
        return {
          dialogue: context.retry ? script?.hint ?? prompt : prompt,
          state: 'THINKING',
        };
      }
      case 'FEEDBACK':
        if (context.isCorrect) {
          return { dialogue: script?.correct ?? 'Correct!', state: 'CELEBRATING' };
        }
        return { dialogue: script?.incorrect ?? 'Not quite. Look at the Smart Board again.', state: 'THINKING' };
      case 'PRACTICE':
      case 'CHALLENGE':
      case 'ASSESS':
        return { dialogue: script?.transition ?? stepAt(stepIdx).buddyDialogue, state: stage === 'ASSESS' ? 'WAITING' : 'ENCOURAGING' };
      case 'REWARD':
      case 'NEXT':
        return { dialogue: script?.completion ?? stepAt(steps.length - 1).buddyDialogue, state: 'CELEBRATING' };
      default:
        return { dialogue: stepAt(stepIdx).buddyDialogue, state: 'EXPLAINING' };
    }
  }

  /**
   * Deterministic mastery level calculation.
   */
  private calculateMasteryLevel(score: number): ClassroomMasteryLevel {
    if (score >= 85) return 'MASTERED';
    if (score >= 70) return 'PRACTICING';
    if (score >= 40) return 'DEVELOPING';
    if (score >= 20) return 'INTRODUCED';
    return 'NOT_STARTED';
  }

  /**
   * Misconception guidance from the ACTIVE lesson: the question's own
   * explanation, else the lesson's Buddy hint. Never another concept's advice.
   */
  private getMisconceptionAdvice(_tag: string | undefined, explanation: string | undefined, lesson: ClassroomLesson): string {
    return explanation || lesson.buddyScript?.hint || `Review the key idea for ${lesson.topicTitle} on the Smart Board.`;
  }

  /**
   * Safe fallback payload built from the ACTIVE lesson. No image asset from
   * any other concept; the Class renders its deterministic visual instead.
   */
  private buildSafeVisualFallback(
    lesson: ClassroomLesson,
    stage: ClassroomStage
  ): SmartBoardVisualPayload {
    return {
      type: 'visual_requirement',
      visualType: 'scientific_diagram',
      title: lesson.topicTitle,
      purpose: `Pedagogical visualization for ${stage} stage: ${lesson.learningObjective}`,
      metadata: { conceptId: lesson.conceptId, subject: lesson.subject, stage },
    };
  }
}

export const xiraClassroomOrchestrator = XiraClassroomOrchestrator.getInstance();
