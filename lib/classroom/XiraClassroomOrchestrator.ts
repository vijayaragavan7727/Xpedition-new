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
import {
  CANONICAL_CLASSROOM_LESSONS,
  getClassroomLesson,
} from './classroomCatalog';
import { ClassroomLesson } from '@/components/classroom/types';
import { getClassroomSessionStore, IClassroomSessionStore } from './ClassroomSessionStore';

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
    initialStage: ClassroomStage = 'INTRODUCE'
  ): Promise<ClassroomSessionState> {
    const lesson: ClassroomLesson = getClassroomLesson(conceptId);
    const sessionId = `sess_${conceptId}_${Date.now()}`;

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
      nextRecommendedConceptId: this.resolveNextConcept(lesson.conceptId),
    };

    this.sessions.set(sessionId, sessionState);
    await this.sessionStore.saveSession(sessionState);

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
  public getSession(sessionId: string): ClassroomSessionState | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Processes a learner action and coordinates classroom state evolution.
   */
  public async processLearnerAction(
    sessionId: string,
    action: ClassroomLearnerAction
  ): Promise<ClassroomSessionState> {
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = (await this.sessionStore.getSession(sessionId)) || undefined;
      if (session) {
        this.sessions.set(sessionId, session);
      }
    }
    if (!session) {
      throw new Error(`Classroom session not found: ${sessionId}`);
    }

    const lesson: ClassroomLesson = CANONICAL_CLASSROOM_LESSONS[session.conceptId] || getClassroomLesson(session.conceptId);

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
            message: 'Spot on! You correctly deduced the underlying electromagnetic interaction.',
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

          const misconceptionExplanation = this.getMisconceptionAdvice(misconception);
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
        const hintText = activeQ?.hint?.hints?.[0] || 'Observe the orientation of the magnetic poles and the direction of current in the coil.';

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
    await this.sessionStore.saveSession(session);

    return { ...session };
  }

  /**
   * Buddy companion reaction and concise voice synthesis.
   */
  private resolveBuddyReaction(
    stage: ClassroomStage,
    lesson: ClassroomLesson,
    stepIdx: number,
    context: { isCorrect?: boolean; retry?: boolean } = {}
  ): { dialogue: string; state: BuddyState } {
    switch (stage) {
      case 'INTRODUCE':
        return {
          dialogue: `Welcome! Today we are exploring ${lesson.topicTitle}. Let's look at the Smart Board together.`,
          state: 'INTRODUCING',
        };

      case 'EXPLAIN':
        return {
          dialogue: 'Notice the core physical components on the board. The permanent magnets create the field, while current drives rotation.',
          state: 'EXPLAINING',
        };

      case 'DEMONSTRATE':
        return {
          dialogue: 'Watch the rotation cycle. As the coil passes vertical, current reverses so torque keeps driving in the same direction.',
          state: 'EXPLAINING',
        };

      case 'INTERACT':
        return {
          dialogue: 'Your turn! Tap the active components or toggle the rotation switch to inspect the electromagnetic couple.',
          state: 'ENCOURAGING',
        };

      case 'QUESTION':
        return {
          dialogue: context.retry
            ? 'Give it another shot! Consider which rotating part switches contact segments every half turn.'
            : 'Predict what happens: which component reverses the current in the coil every half-turn?',
          state: 'THINKING',
        };

      case 'FEEDBACK':
        if (context.isCorrect) {
          return {
            dialogue: 'Spot on! The split-ring commutator switches contact with the brushes, keeping torque unidirectional!',
            state: 'CELEBRATING',
          };
        }
        return {
          dialogue: 'Not quite. Check the rotating copper ring connected to the axle on the Smart Board.',
          state: 'THINKING',
        };

      case 'PRACTICE':
        return {
          dialogue: 'Great progress. Now let us apply this principle: if we double the loop current, how does torque respond?',
          state: 'ENCOURAGING',
        };

      case 'CHALLENGE':
        return {
          dialogue: 'Diagnostic Challenge! What happens if the commutator is permanently welded into a solid ring without a gap?',
          state: 'THINKING',
        };

      case 'ASSESS':
        return {
          dialogue: 'Final check. Solve this independent application without hints to cement your mastery.',
          state: 'WAITING',
        };

      case 'REWARD':
        return {
          dialogue: 'Outstanding work! You have completely mastered DC motor commutation and Lorentz force!',
          state: 'CELEBRATING',
        };

      case 'NEXT':
        return {
          dialogue: 'Lesson complete! You are ready to explore the next frontier in kinematics or electromechanics.',
          state: 'INTRODUCING',
        };

      default:
        return {
          dialogue: 'Observe the Smart Board carefully.',
          state: 'EXPLAINING',
        };
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
   * Provides deterministic misconception guidance.
   */
  private getMisconceptionAdvice(tag?: string): string {
    const adviceMap: Record<string, string> = {
      commutator_vs_brushes:
        'Notice the distinction: carbon brushes are stationary sliding contacts, whereas the split-ring commutator rotates with the axle and reverses current direction.',
      linear_vs_quadratic_torque:
        'Torque scales linearly with current: tau = N * I * A * B * sin(alpha). Doubling current doubles torque directly.',
      continuous_force_inversion:
        'Without a commutator, after 90 degrees the upward force acts on the opposite side, producing a counter-torque that pulls the rotor backward and stalls it.',
    };

    return tag && adviceMap[tag]
      ? adviceMap[tag]
      : 'Review the Smart Board diagram to trace how current flow direction relates to magnetic force.';
  }

  /**
   * Guaranteed safe visual fallback payload preventing broken boards.
   */
  private buildSafeVisualFallback(
    lesson: ClassroomLesson,
    stage: ClassroomStage
  ): SmartBoardVisualPayload {
    return {
      type: 'visual_requirement',
      visualType: 'scientific_diagram',
      assetUrl: '/images/classroom/dc-motor-diagram-clean.png',
      title: lesson.topicTitle,
      purpose: `Pedagogical visualization for ${stage} stage: ${lesson.learningObjective}`,
      interaction: {
        isInteractive: stage === 'INTERACT',
        hotspots: [
          { id: 'h1', label: 'Stator Magnets', description: 'North & South magnetic poles' },
          { id: 'h2', label: 'Armature Coil', description: 'Current-carrying rotor loop' },
          { id: 'h3', label: 'Commutator', description: 'Split-ring polarity inverter' },
        ],
      },
    };
  }

  /**
   * Resolves the next recommended concept in the curriculum journey.
   */
  private resolveNextConcept(currentConceptId: string): string {
    if (currentConceptId === 'dc_motor') return 'projectile_motion';
    if (currentConceptId === 'projectile_motion') return 'human_heart_anatomy';
    return 'dc_motor';
  }
}

export const xiraClassroomOrchestrator = XiraClassroomOrchestrator.getInstance();
