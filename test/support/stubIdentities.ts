import type { BrowserContext } from '@playwright/test';
import { authCookieValue, sessionFor, type StubUser } from './stubSupabase';

export const STUB_PORT = 54400;
export const STUB_URL = `http://127.0.0.1:${STUB_PORT}`;
/** @supabase/ssr cookie name: sb-<first hostname label>-auth-token */
export const AUTH_COOKIE = 'sb-127-auth-token';

export const LEARNER_A: StubUser = { id: 'aaaaaaaa-0000-4000-8000-00000000000a', email: 'learner-a@test.invalid' };
export const LEARNER_B: StubUser = { id: 'bbbbbbbb-0000-4000-8000-00000000000b', email: 'learner-b@test.invalid' };

export async function signInAs(context: BrowserContext, baseURL: string, user: StubUser) {
  await context.clearCookies();
  await context.addCookies([{ name: AUTH_COOKIE, value: authCookieValue(sessionFor(user)), url: baseURL, sameSite: 'Lax' }]);
}

export async function stubCalls(): Promise<Array<{ method: string; path: string; bearerSub: string | null }>> {
  const res = await fetch(`${STUB_URL}/__stub/calls`);
  return res.json();
}

export async function resetStubCalls() {
  await fetch(`${STUB_URL}/__stub/calls`, { method: 'DELETE' });
}
