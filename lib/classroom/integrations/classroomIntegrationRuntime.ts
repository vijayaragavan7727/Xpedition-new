import type { ClassroomLesson, ClassroomLessonStep } from '@/components/classroom/types';
import type { SmartBoardVisualPayload } from '@/lib/visualIntelligence/types';
import type { ClassroomStage } from './types';
import type { ClassStepStage } from '@/components/classroom/types';
import { resolveStepStage } from '../classStage';

const VISUAL_STAGES = new Set<ClassroomStage>(['EXPLAIN', 'VISUALIZE', 'INTERACT', 'FEEDBACK']);

const CLASS_TO_INTEGRATION_STAGE: Record<ClassStepStage, ClassroomStage> = {
  introduce: 'INTRO',
  explain: 'EXPLAIN',
  show: 'VISUALIZE',
  interact: 'INTERACT',
  question: 'QUESTION',
  practice: 'PRACTICE',
  challenge: 'PRACTICE',
  assess: 'PRACTICE',
  reward: 'REWARD',
};

/** Uses the single shared stage resolver (lib/classroom/classStage.ts). */
function stageForStep(step: ClassroomLessonStep, stepIndex: number, totalSteps: number): ClassroomStage {
  return CLASS_TO_INTEGRATION_STAGE[resolveStepStage(step, stepIndex, totalSteps)];
}

export function getClassroomStage(step: ClassroomLessonStep, stepIndex = 0, totalSteps = 1): ClassroomStage {
  return stageForStep(step, stepIndex, totalSteps);
}

export function shouldRequestExternalTeachingScene(stage: ClassroomStage): boolean {
  return VISUAL_STAGES.has(stage);
}

/**
 * Provider status is fetched once per page load. The Class only calls the
 * external scene endpoint when OpenMAIC is actually configured; otherwise the
 * deterministic Xpedition visual is used with zero extra requests.
 */
let openMaicConfiguredPromise: Promise<boolean> | null = null;

function isOpenMaicConfigured(): Promise<boolean> {
  if (!openMaicConfiguredPromise) {
    openMaicConfiguredPromise = fetch('/api/classroom/integrations', { method: 'GET' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { providers?: Array<{ id: string; status: string }> } | null) =>
        Boolean(data?.providers?.some((p) => p.id === 'openmaic' && p.status === 'configured'))
      )
      .catch(() => false);
  }
  return openMaicConfiguredPromise;
}

/** Test hook. */
export function __resetIntegrationStatusCache(): void {
  openMaicConfiguredPromise = null;
}

export async function requestExternalTeachingScene(args: {
  lesson: ClassroomLesson;
  step: ClassroomLessonStep;
  stepIndex: number;
  signal?: AbortSignal;
}): Promise<SmartBoardVisualPayload | null> {
  const stage = stageForStep(args.step, args.stepIndex, args.lesson.steps.length);
  if (!shouldRequestExternalTeachingScene(stage)) return null;
  if (!(await isOpenMaicConfigured())) return null;
  if (args.signal?.aborted) return null;

  const timeoutController = new AbortController();
  const timer = setTimeout(() => {
    timeoutController.abort(new Error('Scene request timeout (3000ms)'));
  }, 3000);

  const onExternalAbort = () => {
    timeoutController.abort();
  };

  if (args.signal) {
    if (args.signal.aborted) {
      clearTimeout(timer);
      return null;
    }
    args.signal.addEventListener('abort', onExternalAbort, { once: true });
  }

  try {
    const response = await fetch('/api/classroom/integrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: timeoutController.signal,
      body: JSON.stringify({
        action: 'generate_scene',
        provider: 'openmaic',
        context: {
          conceptId: args.lesson.conceptId,
          topicTitle: args.lesson.topicTitle,
          subject: args.lesson.subject,
          stage,
          stepIndex: args.stepIndex,
          lesson: args.lesson,
          step: args.step,
          purpose: stage === 'INTERACT' ? 'interact' : 'visualize',
        },
      }),
    });

    if (!response.ok) return null;
    const data = (await response.json()) as {
      success?: boolean;
      scene?: { payload?: { xpeditionVisualPayload?: SmartBoardVisualPayload } };
    };

    return data.success ? data.scene?.payload?.xpeditionVisualPayload || null : null;
  } catch (_err) {
    // Timeout or network error safely returns null without blanking the Smart Board
    return null;
  } finally {
    clearTimeout(timer);
    if (args.signal) {
      args.signal.removeEventListener('abort', onExternalAbort);
    }
  }
}
