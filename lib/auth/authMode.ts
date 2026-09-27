/**
 * Single source of truth for how Xpedition authenticates a request.
 *
 *   'supabase'   — Supabase is configured; every identity comes from a real Supabase session.
 *   'dev_local'  — Explicit local-development bypass. Allowed ONLY when
 *                  NODE_ENV === 'development' AND NEXT_PUBLIC_XPEDITION_DEV_AUTH_BYPASS === '1'.
 *   'unavailable'— Anything else (including production with missing Supabase config).
 *                  Callers MUST fail closed: no learner identity, no protected data.
 *
 * Previously a missing NEXT_PUBLIC_SUPABASE_URL silently produced a mock
 * authenticated learner in any environment, including production.
 *
 * This module is pure (no Next.js imports) so it can run in middleware, API
 * routes, client components and unit tests.
 */

export type AuthMode = 'supabase' | 'dev_local' | 'unavailable';

export interface AuthEnv {
  NODE_ENV?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  NEXT_PUBLIC_XPEDITION_DEV_AUTH_BYPASS?: string;
}

/** Stable id of the explicit development-only learner. Never issued in production. */
export const DEV_LOCAL_USER_ID = 'dev-local-user';

export function resolveAuthMode(env: AuthEnv): AuthMode {
  const supabaseConfigured = Boolean(env.NEXT_PUBLIC_SUPABASE_URL?.trim() && env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim());
  if (supabaseConfigured) return 'supabase';
  if (env.NODE_ENV === 'development' && env.NEXT_PUBLIC_XPEDITION_DEV_AUTH_BYPASS === '1') return 'dev_local';
  return 'unavailable';
}

/**
 * Reads the auth-relevant env. Each variable is referenced statically so that
 * Next.js inlines the NEXT_PUBLIC_* values into client bundles.
 */
export function currentAuthEnv(): AuthEnv {
  return {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_XPEDITION_DEV_AUTH_BYPASS: process.env.NEXT_PUBLIC_XPEDITION_DEV_AUTH_BYPASS,
  };
}

export function currentAuthMode(): AuthMode {
  return resolveAuthMode(currentAuthEnv());
}
