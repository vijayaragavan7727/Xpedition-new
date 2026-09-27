/**
 * Signed, learner-bound handles for external resources (e.g. Canvas conversations).
 *
 * Canvas is called with ONE school-wide credential, so Canvas cannot tell
 * learners apart. Xpedition therefore never accepts a raw Canvas conversation id
 * from the browser. When a learner starts a conversation the server returns an
 * opaque handle:
 *
 *     base64url({ p: provider, r: resourceId, u: userId, t: issuedAt }) + "." + HMAC-SHA256
 *
 * The handle is verified on every later action: the signature must be valid, the
 * provider must match, the embedded learner must be the authenticated caller, and
 * the handle must not be expired. This works across server instances without any
 * shared in-memory state, and a learner cannot forge or re-target a handle.
 */

import crypto from 'crypto';

export interface ResourceHandleClaims {
  provider: string;
  resourceId: string;
  userId: string;
  issuedAt: number;
}

export const DEFAULT_HANDLE_MAX_AGE_MS = 12 * 60 * 60 * 1000;
const MIN_SECRET_LENGTH = 32;

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(s: string): Buffer {
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

export class ResourceHandleSigner {
  constructor(private readonly secret: string, private readonly maxAgeMs = DEFAULT_HANDLE_MAX_AGE_MS) {
    if (!secret || secret.length < MIN_SECRET_LENGTH) {
      throw new Error('Resource handle secret must be at least 32 characters.');
    }
  }

  private mac(body: string): Buffer {
    return crypto.createHmac('sha256', this.secret).update(body).digest();
  }

  sign(claims: Omit<ResourceHandleClaims, 'issuedAt'>, now = Date.now()): string {
    const body = b64url(
      Buffer.from(JSON.stringify({ p: claims.provider, r: claims.resourceId, u: claims.userId, t: now }), 'utf8')
    );
    return `${body}.${b64url(this.mac(body))}`;
  }

  /** Returns the resource id only when the handle is authentic, unexpired and bound to `userId`. */
  verify(handle: unknown, expected: { provider: string; userId: string }, now = Date.now()): string | null {
    if (typeof handle !== 'string' || handle.length > 1024) return null;
    const parts = handle.split('.');
    if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
    const [body, sig] = parts;
    const expectedSig = this.mac(body);
    const given = fromB64url(sig);
    if (given.length !== expectedSig.length || !crypto.timingSafeEqual(given, expectedSig)) return null;
    let claims: { p?: unknown; r?: unknown; u?: unknown; t?: unknown };
    try {
      claims = JSON.parse(fromB64url(body).toString('utf8'));
    } catch {
      return null;
    }
    if (claims.p !== expected.provider || claims.u !== expected.userId) return null;
    if (typeof claims.r !== 'string' || !claims.r) return null;
    if (typeof claims.t !== 'number' || now - claims.t > this.maxAgeMs || claims.t - now > 60_000) return null;
    return claims.r;
  }
}

let processSecret: string | null = null;

/**
 * Server signing secret for integration handles.
 *  - XPEDITION_INTEGRATION_SIGNING_SECRET (≥ 32 chars) when set.
 *  - Production without it: null → learner Canvas conversation actions fail closed.
 *  - Development / test: a random per-process secret (handles do not survive restarts).
 */
export function integrationHandleSigner(env: Record<string, string | undefined> = process.env): ResourceHandleSigner | null {
  const configured = env.XPEDITION_INTEGRATION_SIGNING_SECRET?.trim();
  if (configured && configured.length >= MIN_SECRET_LENGTH) return new ResourceHandleSigner(configured);
  if (env.NODE_ENV === 'production') return null;
  if (!processSecret) processSecret = crypto.randomBytes(32).toString('hex');
  return new ResourceHandleSigner(processSecret);
}
