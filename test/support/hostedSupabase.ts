/**
 * Shared helpers for the HOSTED Supabase verification (test code only).
 *
 * - Reads the six required variables from process.env only. Nothing is defaulted,
 *   invented or logged (values are never printed; only names).
 * - Provides a result ledger in which every security assertion records WHICH
 *   LAYER produced the outcome:
 *
 *     DATABASE_RLS_ALLOWED / DATABASE_RLS_DENIED
 *       The statement went straight to Supabase (PostgREST) with the learner's
 *       own JWT (or anon), so the outcome comes from Postgres privileges/RLS.
 *       A denial is only labelled DATABASE_RLS_DENIED when it is proven at the
 *       database: an insert/RPC rejected with SQLSTATE 42501 (RLS or privilege),
 *       or a read/update/delete that affected 0 rows although the owner can see
 *       the row.
 *
 *     APPLICATION_ALLOWED / APPLICATION_DENIED
 *       The request went through an Xpedition API route; the outcome comes from
 *       Xpedition's own authentication/ownership checks. An HTTP 401/403/404 is
 *       never labelled as an RLS result.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const HOSTED_REQUIRED_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'XP_TEST_USER_A_EMAIL',
  'XP_TEST_USER_A_PASSWORD',
  'XP_TEST_USER_B_EMAIL',
  'XP_TEST_USER_B_PASSWORD',
] as const;

export function missingHostedVars(env: Record<string, string | undefined> = process.env): string[] {
  return HOSTED_REQUIRED_VARS.filter((k) => !env[k] || !String(env[k]).trim());
}

export function blockedMessage(missing: string[]): string {
  return `BLOCKED (configuration): missing ${missing.join(', ')}. No hosted-Supabase result is claimed.`;
}

/** `sb-<project-ref>-auth-token`: the cookie @supabase/ssr writes for this project. */
export function authCookieNameFor(url: string): string {
  return `sb-${new URL(url).hostname.split('.')[0]}-auth-token`;
}

export function anonClient(): SupabaseClient {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function signIn(email: string, password: string): Promise<{ client: SupabaseClient; id: string }> {
  const client = anonClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  // Never echo the email/password back; only the error class.
  if (error || !data.user) throw new Error(`hosted sign-in failed (${error?.status ?? '?'} ${error?.code ?? error?.name ?? 'unknown'})`);
  return { client, id: data.user.id };
}

export async function signInLearners() {
  const A = await signIn(process.env.XP_TEST_USER_A_EMAIL!, process.env.XP_TEST_USER_A_PASSWORD!);
  const B = await signIn(process.env.XP_TEST_USER_B_EMAIL!, process.env.XP_TEST_USER_B_PASSWORD!);
  if (A.id === B.id) throw new Error('XP_TEST_USER_A and XP_TEST_USER_B must be two different users');
  return { A, B };
}

// ---------------------------------------------------------------------------
// Result ledger
// ---------------------------------------------------------------------------

export type Layer = 'DATABASE_RLS' | 'APPLICATION';
export type Outcome = 'ALLOWED' | 'DENIED';
export type Label = `${Layer}_${Outcome}`;

export interface LedgerEntry {
  check: string;
  label: Label | 'BLOCKED';
  status: 'pass' | 'fail' | 'blocked';
  detail?: string;
}

export class Ledger {
  readonly entries: LedgerEntry[] = [];

  record(check: string, layer: Layer, outcome: Outcome, detail?: string) {
    this.entries.push({ check, label: `${layer}_${outcome}`, status: 'pass', detail });
  }

  fail(check: string, expected: Label, detail: string) {
    this.entries.push({ check, label: expected, status: 'fail', detail });
  }

  blocked(check: string, detail: string) {
    this.entries.push({ check, label: 'BLOCKED', status: 'blocked', detail });
  }

  summary() {
    const by = (pred: (e: LedgerEntry) => boolean) => this.entries.filter(pred).length;
    return {
      databaseRlsChecks: by((e) => e.label.startsWith('DATABASE_RLS')),
      applicationChecks: by((e) => e.label.startsWith('APPLICATION')),
      allowedChecks: by((e) => e.label.endsWith('_ALLOWED')),
      deniedChecks: by((e) => e.label.endsWith('_DENIED')),
      blockedChecks: by((e) => e.status === 'blocked'),
      passed: by((e) => e.status === 'pass'),
      failed: by((e) => e.status === 'fail'),
    };
  }

  print(title: string) {
    const s = this.summary();
    console.log(`\n---------------- ${title} ----------------`);
    for (const e of this.entries) {
      const mark = e.status === 'pass' ? '✓' : e.status === 'fail' ? '✗' : '–';
      console.log(`  ${mark} [${e.label}] ${e.check}${e.detail ? ` — ${e.detail}` : ''}`);
    }
    console.log(
      `  database/RLS checks: ${s.databaseRlsChecks} | application checks: ${s.applicationChecks} | allowed: ${s.allowedChecks} | denied: ${s.deniedChecks} | blocked: ${s.blockedChecks} | passed: ${s.passed} | failed: ${s.failed}`
    );
    return s;
  }
}

// ---------------------------------------------------------------------------
// Database-layer probes (direct PostgREST calls with a learner's own JWT)
// ---------------------------------------------------------------------------

type Pg = { code?: string; message?: string } | null;

export const isRlsOrPrivilegeError = (error: Pg) => Boolean(error && error.code === '42501');

/**
 * Proves a read is denied BY THE DATABASE: the owner can see the row (so it
 * exists) and the other actor's identical query returns 0 rows or 42501.
 */
export async function assertReadDeniedByRls(
  ledger: Ledger,
  check: string,
  owner: SupabaseClient,
  other: SupabaseClient,
  table: string,
  column: string,
  value: string
) {
  const own = await owner.from(table).select(column).eq(column, value);
  if (own.error || (own.data?.length ?? 0) !== 1) {
    ledger.fail(check, 'DATABASE_RLS_DENIED', `precondition: owner cannot see the row (${own.error?.code ?? own.data?.length})`);
    return;
  }
  const r = await other.from(table).select(column).eq(column, value);
  if (!r.error && (r.data?.length ?? 0) === 0) return ledger.record(check, 'DATABASE_RLS', 'DENIED', '0 rows returned for an existing row');
  if (isRlsOrPrivilegeError(r.error)) return ledger.record(check, 'DATABASE_RLS', 'DENIED', 'SQLSTATE 42501');
  ledger.fail(check, 'DATABASE_RLS_DENIED', r.error ? `unexpected error ${r.error.code}` : `${r.data?.length} row(s) visible`);
}

/** A write that the database must reject with 42501 (RLS WITH CHECK / privilege). */
export async function assertWriteRejectedByRls(ledger: Ledger, check: string, run: () => PromiseLike<{ error: Pg }>) {
  const { error } = await run();
  if (isRlsOrPrivilegeError(error)) return ledger.record(check, 'DATABASE_RLS', 'DENIED', 'SQLSTATE 42501');
  ledger.fail(check, 'DATABASE_RLS_DENIED', error ? `rejected, but not by RLS (${error.code})` : 'write was ACCEPTED');
}

/** An update/delete that must affect 0 rows (RLS USING hides the target). */
export async function assertMutationAffectsNothing(
  ledger: Ledger,
  check: string,
  run: () => PromiseLike<{ data: unknown[] | null; error: Pg }>
) {
  const { data, error } = await run();
  if (!error && (data?.length ?? 0) === 0) return ledger.record(check, 'DATABASE_RLS', 'DENIED', '0 rows affected');
  if (isRlsOrPrivilegeError(error)) return ledger.record(check, 'DATABASE_RLS', 'DENIED', 'SQLSTATE 42501');
  ledger.fail(check, 'DATABASE_RLS_DENIED', error ? `unexpected error ${error.code}` : `${data?.length} row(s) affected`);
}

export async function assertAllowed(
  ledger: Ledger,
  check: string,
  run: () => PromiseLike<{ data: unknown; error: Pg }>,
  validate: (data: unknown) => boolean = () => true
) {
  const { data, error } = await run();
  if (!error && validate(data)) return ledger.record(check, 'DATABASE_RLS', 'ALLOWED');
  ledger.fail(check, 'DATABASE_RLS_ALLOWED', error ? `error ${error.code}` : 'unexpected result');
}
