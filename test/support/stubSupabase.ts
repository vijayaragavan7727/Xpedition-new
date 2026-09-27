/**
 * LOCAL TEST STUB for the two Supabase HTTP surfaces the app calls in the
 * learner-switching browser test: GoTrue `/auth/v1/user` + `/auth/v1/logout` and
 * PostgREST `/rest/v1/*`. It exists ONLY so the real app bundle can be exercised
 * with two distinct signed-in identities in a browser. It is not Supabase and
 * proves nothing about hosted Supabase or RLS (see test/phase4Rls.pg.test.ts and
 * test/phase4SupabaseLive.test.ts for those).
 *
 * It records every PostgREST call with the bearer token it carried, so the test
 * can assert that server-side persistence ran AS the learner (not as anon).
 */

import http from 'http';
import crypto from 'crypto';

export interface StubUser {
  id: string;
  email: string;
}

export interface RecordedCall {
  method: string;
  path: string;
  bearerSub: string | null;
  apikey: string | null;
}

const b64url = (s: string) => Buffer.from(s).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export function fakeJwt(user: StubUser, expSeconds: number): string {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = b64url(
    JSON.stringify({ sub: user.id, email: user.email, role: 'authenticated', aud: 'authenticated', exp: expSeconds, session_id: crypto.randomUUID() })
  );
  return `${header}.${payload}.${b64url(crypto.randomBytes(16).toString('hex'))}`;
}

export function sessionFor(user: StubUser) {
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + 3600 * 6;
  return {
    access_token: fakeJwt(user, expiresAt),
    token_type: 'bearer',
    expires_in: 3600 * 6,
    expires_at: expiresAt,
    refresh_token: crypto.randomBytes(12).toString('hex'),
    user: {
      id: user.id,
      aud: 'authenticated',
      role: 'authenticated',
      email: user.email,
      app_metadata: { provider: 'email' },
      user_metadata: {},
      created_at: new Date().toISOString(),
    },
  };
}

/** `sb-<host>-auth-token` cookie value as written by @supabase/ssr (base64url, `base64-` prefix). */
export function authCookieValue(session: ReturnType<typeof sessionFor>): string {
  return `base64-${b64url(JSON.stringify(session))}`;
}

function subOf(authorization: string | undefined): string | null {
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const claims = JSON.parse(Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
    return typeof claims.sub === 'string' ? claims.sub : null;
  } catch {
    return null;
  }
}

export async function startStubSupabase(port: number, users: StubUser[]) {
  const calls: RecordedCall[] = [];
  const revoked = new Set<string>();
  const server = http.createServer((req, res) => {
    const url = new URL(req.url || '/', `http://localhost:${port}`);
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS,HEAD');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'authorization,apikey,content-type,prefer,x-client-info,accept-profile,content-profile,x-supabase-api-version,range'
    );
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
    if (url.pathname === '/__stub/calls') {
      if (req.method === 'DELETE') calls.length = 0;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(calls));
      return;
    }
    const auth = req.headers.authorization;
    const sub = subOf(auth);
    const json = (status: number, body: unknown) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(body === undefined ? '' : JSON.stringify(body));
    };

    if (url.pathname === '/auth/v1/user') {
      const user = users.find((u) => u.id === sub);
      if (!user || revoked.has(auth || '')) return json(401, { code: 401, error_code: 'bad_jwt', msg: 'invalid JWT' });
      return json(200, { id: user.id, aud: 'authenticated', role: 'authenticated', email: user.email, app_metadata: {}, user_metadata: {} });
    }
    if (url.pathname === '/auth/v1/logout') {
      if (auth) revoked.add(auth);
      res.writeHead(204);
      res.end();
      return;
    }
    if (url.pathname.startsWith('/auth/v1/')) return json(400, { code: 400, msg: 'not supported by the test stub' });

    if (url.pathname.startsWith('/rest/v1/')) {
      calls.push({ method: req.method || 'GET', path: url.pathname, bearerSub: sub, apikey: (req.headers.apikey as string) || null });
      req.resume();
      if (url.pathname === '/rest/v1/rpc/xp_rate_limit_hit') {
        return json(200, [{ allowed: true, hits: 1, reset_at: new Date(Date.now() + 60000).toISOString() }]);
      }
      if (req.method === 'GET' || req.method === 'HEAD') return json(200, []);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end('[]');
      return;
    }
    json(404, { message: 'not found' });
  });
  await new Promise<void>((resolve) => server.listen(port, '127.0.0.1', () => resolve()));
  return {
    calls,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}
