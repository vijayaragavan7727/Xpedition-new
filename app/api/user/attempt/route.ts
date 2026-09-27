import '@/lib/supabase/serverDb';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveLessonRequestIdentity } from '@/lib/concepts/routeConceptResolution';
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.attempt) {
      return NextResponse.json({ error: 'Missing attempt record' }, { status: 400 });
    }

    // Exact concept identity: no default concept. Canonical ids are normalised to
    // the registry id/title; learner goal-graph ids must be sent explicitly.
    const identity = resolveLessonRequestIdentity({
      conceptId: body.conceptId ?? body.attempt?.conceptId,
      conceptName: body.conceptName ?? body.attempt?.conceptName,
    });
    if (!identity.ok) {
      return NextResponse.json({ error: identity.error }, { status: 400 });
    }
    const { attempt } = body;
    const { conceptId, conceptName } = identity;

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
