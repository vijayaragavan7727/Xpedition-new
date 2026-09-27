/**
 * Offline self-test of the hosted-verification ledger and layer probes
 * (test/support/hostedSupabase.ts). Uses fake PostgREST-shaped clients so the
 * labelling logic is proven before any hosted run:
 *   - a denial is only DATABASE_RLS_DENIED when proven at the database;
 *   - an accepted write, a visible row, or a non-RLS error is a FAILURE, never a pass;
 *   - a missing precondition (owner cannot see the row) is a failure, not a vacuous pass.
 *
 * Run: npx tsx test/hostedSupabaseHelpers.test.ts
 */

import assert from 'assert';
import {
  Ledger,
  assertAllowed,
  assertMutationAffectsNothing,
  assertReadDeniedByRls,
  assertWriteRejectedByRls,
  authCookieNameFor,
  missingHostedVars,
} from './support/hostedSupabase';

type Rows = Record<string, unknown>[];
/** Minimal fake: from(table).select().eq() resolves to the configured result. */
function fakeClient(result: { data: Rows | null; error: { code: string } | null }) {
  const chain = {
    select: () => chain,
    eq: () => chain,
    then: (resolve: (v: unknown) => void) => resolve(result),
  };
  return { from: () => chain } as never;
}
const owner = fakeClient({ data: [{ id: 'x' }], error: null });

let passed = 0;
let failed = 0;
async function test(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ✗ ${name}\n      ${(e as Error).message}`);
  }
}

async function main() {
  console.log('HOSTED VERIFICATION HELPERS (offline self-test)');

  await test('env check reports exactly the missing names and never defaults', () => {
    assert.deepStrictEqual(missingHostedVars({}), [
      'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'XP_TEST_USER_A_EMAIL',
      'XP_TEST_USER_A_PASSWORD', 'XP_TEST_USER_B_EMAIL', 'XP_TEST_USER_B_PASSWORD',
    ]);
    assert.deepStrictEqual(missingHostedVars({ NEXT_PUBLIC_SUPABASE_URL: '  ' }).includes('NEXT_PUBLIC_SUPABASE_URL'), true);
    assert.strictEqual(authCookieNameFor('https://abcdefgh.supabase.co'), 'sb-abcdefgh-auth-token');
  });

  await test('0 rows for an owner-visible row → DATABASE_RLS_DENIED', async () => {
    const l = new Ledger();
    await assertReadDeniedByRls(l, 'c', owner, fakeClient({ data: [], error: null }), 't', 'id', 'x');
    assert.deepStrictEqual([l.entries[0].label, l.entries[0].status], ['DATABASE_RLS_DENIED', 'pass']);
  });

  await test('visible row for the other actor → FAIL (leak)', async () => {
    const l = new Ledger();
    await assertReadDeniedByRls(l, 'c', owner, fakeClient({ data: [{ id: 'x' }], error: null }), 't', 'id', 'x');
    assert.strictEqual(l.entries[0].status, 'fail');
  });

  await test('owner cannot see the row → FAIL (no vacuous pass)', async () => {
    const l = new Ledger();
    await assertReadDeniedByRls(l, 'c', fakeClient({ data: [], error: null }), fakeClient({ data: [], error: null }), 't', 'id', 'x');
    assert.strictEqual(l.entries[0].status, 'fail');
  });

  await test('write rejected with 42501 → DATABASE_RLS_DENIED; accepted or other error → FAIL', async () => {
    const l = new Ledger();
    await assertWriteRejectedByRls(l, 'rls', async () => ({ error: { code: '42501' } }));
    await assertWriteRejectedByRls(l, 'accepted', async () => ({ error: null }));
    await assertWriteRejectedByRls(l, 'fk', async () => ({ error: { code: '23503' } }));
    assert.deepStrictEqual(l.entries.map((e) => e.status), ['pass', 'fail', 'fail']);
    assert.strictEqual(l.entries[0].label, 'DATABASE_RLS_DENIED');
  });

  await test('mutation affecting 0 rows → DENIED; affecting rows → FAIL', async () => {
    const l = new Ledger();
    await assertMutationAffectsNothing(l, 'none', async () => ({ data: [], error: null }));
    await assertMutationAffectsNothing(l, 'some', async () => ({ data: [{ id: 1 }], error: null }));
    assert.deepStrictEqual(l.entries.map((e) => e.status), ['pass', 'fail']);
  });

  await test('allowed operations are labelled DATABASE_RLS_ALLOWED only when they succeed and validate', async () => {
    const l = new Ledger();
    await assertAllowed(l, 'ok', async () => ({ data: [{ id: 1 }], error: null }), (d) => Array.isArray(d) && d.length === 1);
    await assertAllowed(l, 'err', async () => ({ data: null, error: { code: '42501' } }));
    assert.deepStrictEqual(l.entries.map((e) => `${e.label}:${e.status}`), ['DATABASE_RLS_ALLOWED:pass', 'DATABASE_RLS_ALLOWED:fail']);
  });

  await test('application results are never counted as RLS; summary splits layers and outcomes', () => {
    const l = new Ledger();
    l.record('api 404', 'APPLICATION', 'DENIED', 'HTTP 404');
    l.record('db', 'DATABASE_RLS', 'DENIED');
    l.record('api ok', 'APPLICATION', 'ALLOWED');
    l.blocked('x', 'no creds');
    assert.deepStrictEqual(l.summary(), {
      databaseRlsChecks: 1, applicationChecks: 2, allowedChecks: 1, deniedChecks: 2, blockedChecks: 1, passed: 3, failed: 0,
    });
  });

  console.log(`HOSTED HELPERS SUMMARY: ${passed} passed, ${failed} failed`);
  if (failed) process.exit(1);
}

main();
