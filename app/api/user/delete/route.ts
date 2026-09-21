import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { defaultSupabasePersistence } from '@/lib/persistence';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/user/delete
 * Permanently deletes all application data, attempts, mastery, and memories for the authenticated user.
 *
 * Security Requirements:
 * - Authenticated session is authoritative.
 * - Arbitrary userId in payload is ignored (no IDOR).
 * - Explicit confirmation required: { confirm: 'DELETE_MY_ACCOUNT_AND_DATA' }.
 * - Signs out active session.
 */
export async function POST(request: Request) {
  try {
    let userId: string | null = null;

    // 1. Verify session identity strictly via Supabase server client
    const supabase = createClient();
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to delete your account.' },
        { status: 401 }
      );
    }

    // 3. Verify explicit user confirmation
    const body = await request.json().catch(() => null);
    if (!body || body.confirm !== 'DELETE_MY_ACCOUNT_AND_DATA') {
      return NextResponse.json(
        {
          error: 'Explicit confirmation required. Payload must include confirm: "DELETE_MY_ACCOUNT_AND_DATA"',
        },
        { status: 400 }
      );
    }

    // 4. Delete user-owned application data (profiles, attempts, mastery, memories)
    const dataCleared = await defaultSupabasePersistence.clearUserState(userId);
    if (!dataCleared) {
      return NextResponse.json(
        { error: 'Failed to clear user data. Please try again or contact support.' },
        { status: 500 }
      );
    }

    // 5. Invalidate active session if Supabase is connected
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (signOutErr) {
        console.warn('[API /api/user/delete] Sign out notice:', signOutErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'All learning records, attempts, mastery states, and profile data have been permanently deleted.',
      deletedUserId: userId,
    });
  } catch (err: any) {
    console.error('[API /api/user/delete POST] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
