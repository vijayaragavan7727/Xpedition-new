import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { defaultSupabasePersistence } from '@/lib/persistence';

export const runtime = 'nodejs';

/**
 * POST /api/user/attempt
 * Idempotently records an attempt and updates learner mastery.
 */
export async function POST(request: Request) {
  try {
    let userId: string | null = null;
    const supabase = createClient();
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
      }
    }

    if (!userId) {
      userId = request.headers.get('x-user-id');
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.attempt) {
      return NextResponse.json({ error: 'Missing attempt record' }, { status: 400 });
    }

    const { attempt, conceptId = 'default_concept', conceptName = 'Core Topic' } = body;

    const result = await defaultSupabasePersistence.recordAttempt({
      userId,
      attempt,
      conceptId,
      conceptName,
    });

    return NextResponse.json({
      success: result.success,
      isDuplicate: result.isDuplicate,
      attemptId: attempt.id,
    });
  } catch (err: any) {
    console.error('[API /api/user/attempt POST] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
