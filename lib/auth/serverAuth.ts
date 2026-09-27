import { NextResponse } from 'next/server';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { currentAuthEnv, DEV_LOCAL_USER_ID, resolveAuthMode, type AuthEnv } from './authMode';

export interface ServerAuthResult {
  user: User | null;
  errorResponse: NextResponse | null;
}

/** Minimal shape of the Supabase auth call we depend on (injectable for tests). */
export type GetSupabaseUser = () => Promise<{ user: User | null; error: unknown }>;

export interface ServerAuthDecision {
  status: 200 | 401 | 503;
  user: User | null;
  code: 'OK' | 'UNAUTHENTICATED' | 'AUTH_UNAVAILABLE';
}

function devLocalUser(): User {
  return {
    id: DEV_LOCAL_USER_ID,
    email: 'dev@xpedition.local',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  } as User;
}

/**
 * Pure authentication decision. Fails CLOSED:
 *  - Supabase configured  → the Supabase session decides (401 when absent/invalid).
 *  - Explicit dev bypass  → development-only local learner.
 *  - Anything else        → 503, never a fake user (production included).
 */
export async function evaluateServerAuth(env: AuthEnv, getUser: GetSupabaseUser | null): Promise<ServerAuthDecision> {
  const mode = resolveAuthMode(env);

  if (mode === 'dev_local') {
    return { status: 200, user: devLocalUser(), code: 'OK' };
  }
  if (mode === 'unavailable' || !getUser) {
    return { status: 503, user: null, code: 'AUTH_UNAVAILABLE' };
  }

  try {
    const { user, error } = await getUser();
    if (error || !user) return { status: 401, user: null, code: 'UNAUTHENTICATED' };
    return { status: 200, user, code: 'OK' };
  } catch {
    return { status: 401, user: null, code: 'UNAUTHENTICATED' };
  }
}

/**
 * Validates that an incoming server request is authenticated.
 * Protects AI/learner endpoints (Denial of Wallet, data access).
 */
export async function requireServerAuth(_request?: Request): Promise<ServerAuthResult> {
  const env = currentAuthEnv();
  const supabase = resolveAuthMode(env) === 'supabase' ? createClient() : null;
  const getUser: GetSupabaseUser | null = supabase
    ? async () => {
        const { data, error } = await supabase.auth.getUser();
        return { user: data?.user ?? null, error };
      }
    : null;

  const decision = await evaluateServerAuth(env, getUser);
  if (decision.status === 200 && decision.user) {
    return { user: decision.user, errorResponse: null };
  }
  if (decision.status === 503) {
    return {
      user: null,
      errorResponse: NextResponse.json({ error: 'Authentication service unavailable' }, { status: 503 }),
    };
  }
  return {
    user: null,
    errorResponse: NextResponse.json({ error: 'Unauthorized: Valid session required' }, { status: 401 }),
  };
}
