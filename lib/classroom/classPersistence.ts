/**
 * Class persistence model (Phase 4 decision).
 *
 * The Class lesson itself is static, registry-resolved curriculum and runs in the
 * browser for everyone (guest preview has existed since before Phase 3: /class is
 * not a protected route). What differs is PERSISTENCE:
 *
 *   server_session   an authenticated learner: the server session is created and
 *                    owner-checked; Postgres RLS enforces auth.uid() = user_id.
 *   guest_ephemeral  no authenticated learner (logged out, or the auth service is
 *                    unavailable): NOTHING is persisted — no server session, no
 *                    localStorage; notes live in memory for this visit and the UI
 *                    says "not saved". Guest data is never written under any
 *                    learner identity.
 *
 * A server session is requested only when a real learner session exists, so a
 * guest never produces a 401/503 and a signed-in learner is never silently
 * downgraded (their request goes out and fails loudly if the server refuses it).
 */

import type { AuthMode } from '../auth/authMode';

export type ClassPersistence = 'pending' | 'server_session' | 'guest_ephemeral';

export interface SessionProbe {
  getSession(): Promise<{ data: { session: { user?: { id?: string } | null } | null } | null }>;
}

export async function shouldRequestServerSession(mode: AuthMode, client: SessionProbe | null): Promise<boolean> {
  if (mode === 'dev_local') return true;
  if (mode !== 'supabase' || !client) return false;
  try {
    const { data } = await client.getSession();
    return Boolean(data?.session?.user?.id);
  } catch {
    return false;
  }
}
