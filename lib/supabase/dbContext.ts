/**
 * Which Supabase client may touch learner tables.
 *
 * Browser: the browser client, which carries the signed-in learner's session.
 * Server:  ONLY a request-scoped client built from the caller's auth cookies
 *          (registered by `lib/supabase/serverDb.ts`), so PostgREST evaluates RLS
 *          as that learner (auth.uid() = the requester).
 *
 * Phase 4 root cause: server code used the browser singleton, which on the server
 * has no session and runs as the `anon` role. RLS rejected every write, so server
 * persistence silently fell back to per-instance memory. The anon singleton is
 * never returned on the server any more, and no service-role key is used.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase as browserClient, isSupabaseConfigured } from '../supabase';

export type ServerDbProvider = () => SupabaseClient | null;

let serverProvider: ServerDbProvider | null = null;

/** Called once by lib/supabase/serverDb.ts (server-only). */
export function registerServerDbProvider(provider: ServerDbProvider | null): void {
  serverProvider = provider;
}

export function isServerRuntime(): boolean {
  return typeof window === 'undefined';
}

/**
 * The client allowed to access learner tables in the current context, or null
 * when there is none (not configured, or a server call outside a request).
 */
export function getLearnerDb(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!isServerRuntime()) return browserClient;
  if (!serverProvider) return null;
  try {
    return serverProvider();
  } catch {
    // e.g. cookies() called outside a request scope
    return null;
  }
}
