import { NextResponse } from 'next/server';
import { requireServerAuth } from '@/lib/auth/serverAuth';
import {
  executeLearningAction,
  LearningAction,
  ExecutionContext,
} from '@/lib/intelligence';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { user, errorResponse } = await requireServerAuth(request);
    if (errorResponse) {
      return errorResponse;
    }

    const body = await request.json().catch(() => ({}));
    const { action, context = {} } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Learning action is required.' },
        { status: 400 }
      );
    }

    const sanitizedContext: ExecutionContext = {
      learnerGoal: context.learnerGoal ? String(context.learnerGoal).slice(0, 200) : undefined,
      conceptId: context.conceptId ? String(context.conceptId).slice(0, 100) : undefined,
      conceptName: context.conceptName ? String(context.conceptName).slice(0, 200) : undefined,
      action: action as LearningAction,
      mastery: typeof context.mastery === 'number' ? context.mastery : undefined,
      recentAccuracy: typeof context.recentAccuracy === 'number' ? context.recentAccuracy : undefined,
      confidenceSignal: context.confidenceSignal,
      misconceptionSignal: context.misconceptionSignal ? String(context.misconceptionSignal).slice(0, 300) : undefined,
      language: context.language ? String(context.language).slice(0, 50) : 'english',
      learningPreference: context.learningPreference ? String(context.learningPreference).slice(0, 100) : undefined,
      userQuery: context.userQuery ? String(context.userQuery).slice(0, 1000) : undefined,
      writingAnswer: context.writingAnswer ? String(context.writingAnswer).slice(0, 5000) : undefined,
      writingPrompt: context.writingPrompt ? String(context.writingPrompt).slice(0, 500) : undefined,
      mathExpression: context.mathExpression ? String(context.mathExpression).slice(0, 500) : undefined,
    };

    const result = await executeLearningAction(action as LearningAction, sanitizedContext);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Capability Execution API Error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'An internal error occurred while executing the learning capability.',
        learnerFacingMessage: 'Unable to complete this learning action at the moment.',
      },
      { status: 500 }
    );
  }
}
