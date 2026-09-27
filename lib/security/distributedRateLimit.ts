/**
 * Per-learner rate limiting that holds across server instances.
 *
 * Backends
 *   supabase_shared  Postgres function `public.xp_rate_limit_hit` (supabase/schema.sql §11),
 *                    called with the request-scoped learner client. The function
 *                    derives the key from auth.uid(), so a caller can only ever
 *                    count against its OWN bucket, and every instance shares it.
 *   process_local    The in-memory sliding window (lib/security/rateLimiter.ts).
 *                    Safe for development; in a multi-instance deployment each
 *                    instance counts separately (limit × instances).
 *
 * Failure policy
 *   If the shared backend is unavailable the process-local limiter is used and the
 *   result says so (`backend: 'process_local'`). Set XPEDITION_RATE_LIMIT_REQUIRE_SHARED=1
 *   in production to fail CLOSED (429) instead when the shared store cannot be used.
 *
 * No new dependency: this uses the Supabase/Postgres the app already requires.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { rateLimiter, type RateLimitResult } from './rateLimiter';
import { getLearnerDb } from '../supabase/dbContext';

export type RateLimitBackend = 'supabase_shared' | 'process_local' | 'shared_required_unavailable';

export interface UserRateLimitResult extends RateLimitResult {
  backend: RateLimitBackend;
}

const BUCKET_RE = /^[a-z0-9_.:-]{1,64}$/;

export async function checkUserRateLimit(args: {
  userId: string;
  bucket: string;
  maxRequests: number;
  windowMs: number;
  db?: SupabaseClient | null;
  env?: Record<string, string | undefined>;
}): Promise<UserRateLimitResult> {
  const { userId, bucket, maxRequests, windowMs } = args;
  const env = args.env ?? process.env;
  if (!BUCKET_RE.test(bucket)) throw new Error(`Invalid rate-limit bucket: ${bucket}`);
  const db = args.db === undefined ? getLearnerDb() : args.db;

  if (db) {
    try {
      const { data, error } = await db.rpc('xp_rate_limit_hit', {
        p_bucket: bucket,
        p_window_seconds: Math.max(1, Math.round(windowMs / 1000)),
        p_max: maxRequests,
      });
      const row = Array.isArray(data) ? data[0] : data;
      if (!error && row && typeof row.allowed === 'boolean') {
        const resetTimeMs = row.reset_at ? Date.parse(row.reset_at) : Date.now() + windowMs;
        const hits = Number(row.hits) || 0;
        return {
          backend: 'supabase_shared',
          allowed: row.allowed,
          limit: maxRequests,
          remaining: Math.max(0, maxRequests - hits),
          resetTimeMs,
          retryAfterSeconds: row.allowed ? 0 : Math.max(1, Math.ceil((resetTimeMs - Date.now()) / 1000)),
        };
      }
    } catch {
      // fall through to the policy below
    }
  }

  if (env.XPEDITION_RATE_LIMIT_REQUIRE_SHARED === '1') {
    return {
      backend: 'shared_required_unavailable',
      allowed: false,
      limit: maxRequests,
      remaining: 0,
      resetTimeMs: Date.now() + windowMs,
      retryAfterSeconds: Math.max(1, Math.ceil(windowMs / 1000)),
    };
  }

  const local = await rateLimiter.checkLimit(`${bucket}:user:${userId}`, { maxRequests, windowMs });
  return { ...local, backend: 'process_local' };
}
