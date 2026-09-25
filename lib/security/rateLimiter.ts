/**
 * Xpedition Production Hardening — Rate Limiter & Abuse Prevention
 *
 * Sliding-window rate limiter protecting expensive server routes (AI, visual generation,
 * session creation) from Denial of Wallet and resource exhaustion.
 */

import { NextResponse } from 'next/server';
import { getProductionConfig } from '../config/productionConfig';

export interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTimeMs: number;
  retryAfterSeconds: number;
}

interface WindowBucket {
  timestamps: number[];
}

export class SlidingWindowRateLimiter {
  private static instance: SlidingWindowRateLimiter;
  private readonly buckets: Map<string, WindowBucket> = new Map();
  private readonly defaultOptions: RateLimitOptions;

  constructor(defaultOptions?: Partial<RateLimitOptions>) {
    const config = getProductionConfig();
    this.defaultOptions = {
      maxRequests: defaultOptions?.maxRequests ?? config.rateLimit.defaultMaxPerMin,
      windowMs: defaultOptions?.windowMs ?? 60000, // 1 minute
    };

    // Periodic cleanup of stale buckets every 5 minutes
    if (typeof setInterval !== 'undefined') {
      const timer = setInterval(() => this.cleanup(), 5 * 60 * 1000);
      if (timer.unref) timer.unref();
    }
  }

  public static getInstance(): SlidingWindowRateLimiter {
    if (!SlidingWindowRateLimiter.instance) {
      SlidingWindowRateLimiter.instance = new SlidingWindowRateLimiter();
    }
    return SlidingWindowRateLimiter.instance;
  }

  /**
   * Evaluates if a request from a key is allowed under rate limits
   */
  public async checkLimit(
    key: string,
    customOptions?: Partial<RateLimitOptions>
  ): Promise<RateLimitResult> {
    const config = getProductionConfig();
    if (!config.rateLimit.enabled) {
      return {
        allowed: true,
        limit: 999999,
        remaining: 999999,
        resetTimeMs: Date.now() + 60000,
        retryAfterSeconds: 0,
      };
    }

    const options: RateLimitOptions = {
      maxRequests: customOptions?.maxRequests ?? this.defaultOptions.maxRequests,
      windowMs: customOptions?.windowMs ?? this.defaultOptions.windowMs,
    };

    const now = Date.now();
    const windowStart = now - options.windowMs;

    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = { timestamps: [] };
      this.buckets.set(key, bucket);
    }

    // Filter out timestamps older than the active sliding window
    bucket.timestamps = bucket.timestamps.filter((ts) => ts > windowStart);

    if (bucket.timestamps.length >= options.maxRequests) {
      const oldestInWindow = bucket.timestamps[0];
      const resetTimeMs = oldestInWindow + options.windowMs;
      const retryAfterSeconds = Math.max(1, Math.ceil((resetTimeMs - now) / 1000));

      return {
        allowed: false,
        limit: options.maxRequests,
        remaining: 0,
        resetTimeMs,
        retryAfterSeconds,
      };
    }

    bucket.timestamps.push(now);
    const remaining = options.maxRequests - bucket.timestamps.length;
    const resetTimeMs = now + options.windowMs;

    return {
      allowed: true,
      limit: options.maxRequests,
      remaining,
      resetTimeMs,
      retryAfterSeconds: 0,
    };
  }

  /**
   * Purges buckets with all timestamps expired
   */
  public cleanup(): void {
    const now = Date.now();
    for (const [key, bucket] of this.buckets.entries()) {
      bucket.timestamps = bucket.timestamps.filter((ts) => now - ts < this.defaultOptions.windowMs);
      if (bucket.timestamps.length === 0) {
        this.buckets.delete(key);
      }
    }
  }

  public reset(key?: string): void {
    if (key) {
      this.buckets.delete(key);
    } else {
      this.buckets.clear();
    }
  }
}

export const rateLimiter = SlidingWindowRateLimiter.getInstance();

/**
 * Extracts a client identification key from request (User ID, IP, or Session)
 */
export function getClientRateLimitKey(request: Request, userId?: string, endpoint = 'api'): string {
  if (userId) {
    return `user:${userId}:${endpoint}`;
  }

  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const clientIp = (forwardedFor ? forwardedFor.split(',')[0].trim() : realIp) || '127.0.0.1';

  return `ip:${clientIp}:${endpoint}`;
}

/**
 * Applies standard RFC rate-limiting headers to a response
 */
export function applyRateLimitHeaders(response: NextResponse, result: RateLimitResult): NextResponse {
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.resetTimeMs.toString());
  if (!result.allowed) {
    response.headers.set('Retry-After', result.retryAfterSeconds.toString());
  }
  return response;
}

/**
 * Returns a standardized HTTP 429 Too Many Requests response
 */
export function createRateLimitExceededResponse(result: RateLimitResult): NextResponse {
  const response = NextResponse.json(
    {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Rate limit exceeded. Too many requests. Please retry in ${result.retryAfterSeconds} seconds.`,
      },
    },
    { status: 429 }
  );

  return applyRateLimitHeaders(response, result);
}
