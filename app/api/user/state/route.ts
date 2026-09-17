import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { defaultLocalPersistence, defaultSupabasePersistence, persistenceManager } from '@/lib/persistence';

export const runtime = 'nodejs';

/**
 * GET /api/user/state
 * Retrieves the authenticated user's canonical learner state.
 */
export async function GET(request: Request) {
  try {
    let userId: string | null = null;
    let email = 'learner@xpedition.local';
    let displayName = 'Learner';

    // 1. Check Supabase server session
    const supabase = createClient();
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        email = user.email || email;
        displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || displayName;
      }
    }

    // 2. Fallback to header in local/dev mode
    if (!userId) {
      userId = request.headers.get('x-user-id');
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3. Fetch canonical state
    let state = await defaultSupabasePersistence.getUserState(userId);
    if (!state) {
      state = defaultLocalPersistence.createDefaultUserData(userId, email, displayName);
      await defaultLocalPersistence.saveUserState(userId, state);
    }

    return NextResponse.json({
      success: true,
      data: state,
    });
  } catch (err: any) {
    console.error('[API /api/user/state GET] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/user/state
 * Persists the authenticated user's canonical learner state with strict user isolation.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.data) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    let authenticatedUserId: string | null = null;

    // 1. Verify session identity via Supabase server client
    const supabase = createClient();
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        authenticatedUserId = user.id;
      }
    }

    // 2. Local mode fallback
    if (!authenticatedUserId) {
      authenticatedUserId = request.headers.get('x-user-id');
    }

    if (!authenticatedUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payloadData = body.data;

    // 3. User Isolation / IDOR Protection:
    // Reject if client attempts to write state belonging to another user ID
    if (payloadData.userId && payloadData.userId !== authenticatedUserId) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot modify another user state' },
        { status: 403 }
      );
    }

    payloadData.userId = authenticatedUserId;
    const saved = await defaultSupabasePersistence.saveUserState(authenticatedUserId, payloadData);

    return NextResponse.json({
      success: saved,
      lastSyncedAt: Date.now(),
    });
  } catch (err: any) {
    console.error('[API /api/user/state POST] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
