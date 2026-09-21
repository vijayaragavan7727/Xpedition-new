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

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch canonical state
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
    if (!body || !body.data || typeof body.data !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    let authenticatedUserId: string | null = null;

    // 1. Verify session identity strictly via Supabase server client
    const supabase = createClient();
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        authenticatedUserId = user.id;
      }
    }

    if (!authenticatedUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payloadData = body.data;

    // 2. User Isolation / IDOR Protection:
    // Reject if client attempts to write state belonging to another user ID
    if (payloadData.userId && payloadData.userId !== authenticatedUserId) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot modify another user state' },
        { status: 403 }
      );
    }

    payloadData.userId = authenticatedUserId;

    // 3. Telemetry & Progress Validation Boundary (BIZ-01 mitigation)
    if (payloadData.progression && typeof payloadData.progression === 'object') {
      const prog = payloadData.progression;
      if (typeof prog.xp === 'number') {
        prog.xp = Math.max(0, Math.min(1000000, Math.floor(prog.xp)));
      }
      if (typeof prog.level === 'number') {
        prog.level = Math.max(1, Math.min(1000, Math.floor(prog.level)));
      }
      if (typeof prog.streak === 'number') {
        prog.streak = Math.max(0, Math.min(3650, Math.floor(prog.streak)));
      }
      if (typeof prog.coins === 'number') {
        prog.coins = Math.max(0, Math.min(1000000, Math.floor(prog.coins)));
      }
    }

    // Clamp mastery percentages and theta estimates in skill graphs
    if (Array.isArray(payloadData.graphs)) {
      payloadData.graphs.forEach((g: any) => {
        if (g && Array.isArray(g.concepts)) {
          g.concepts.forEach((c: any) => {
            if (typeof c.masteryPercentage === 'number') {
              c.masteryPercentage = Math.max(0, Math.min(100, Math.round(c.masteryPercentage)));
            }
            if (typeof c.thetaAssisted === 'number') {
              c.thetaAssisted = Math.max(-4.0, Math.min(4.0, c.thetaAssisted));
            }
            if (typeof c.thetaSolo === 'number') {
              c.thetaSolo = Math.max(-4.0, Math.min(4.0, c.thetaSolo));
            }
          });
        }
        if (typeof g.calibratedTheta === 'number') {
          g.calibratedTheta = Math.max(-4.0, Math.min(4.0, g.calibratedTheta));
        }
      });
    }

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
