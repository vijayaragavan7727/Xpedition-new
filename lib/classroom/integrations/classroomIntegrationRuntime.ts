import type { ClassroomLesson, ClassroomLessonStep } from '@/components/classroom/types';
import type { SmartBoardVisualPayload } from '@/lib/visualIntelligence/types';
import type { ClassroomStage } from './types';

const VISUAL_STAGES = new Set<ClassroomStage>(['EXPLAIN', 'VISUALIZE', 'INTERACT', 'FEEDBACK']);

function stageForStep(step: ClassroomLessonStep): ClassroomStage {
  if (step.checkQuestion) return 'QUESTION';
  if (step.visualType === 'interactive_simulation' || step.visualType === 'interactive_diagram') return 'INTERACT';
  if (step.stepNumber <= 1) return 'INTRO';
  if (step.stepNumber === 2) return 'EXPLAIN';
  if (step.stepNumber === 3) return 'VISUALIZE';
  if (step.stepNumber === 4) return 'PRACTICE';
  return 'REWARD';
}

export function getClassroomStage(step: ClassroomLessonStep): ClassroomStage {
  return stageForStep(step);
}

export function shouldRequestExternalTeachingScene(stage: ClassroomStage): boolean {
  return VISUAL_STAGES.has(stage);
}

export async function requestExternalTeachingScene(args: {
  lesson: ClassroomLesson;
  step: ClassroomLessonStep;
  stepIndex: number;
  signal?: AbortSignal;
}): Promise<SmartBoardVisualPayload | null> {
  const stage = stageForStep(args.step);
  if (!shouldRequestExternalTeachingScene(stage)) return null;

  const response = await fetch('/api/classroom/integrations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: args.signal,
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
}
