/**
 * PHASE 4 — HOSTED SUPABASE TWO-USER VERIFICATION (real project, real users)
 *
 * Runs ONLY when a real Supabase project and two real test users are configured.
 * It never fakes a result: without credentials it prints BLOCKED and claims nothing.
 *
 * Required environment (use a dedicated TEST project, never production data):
 *   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   XP_TEST_USER_A_EMAIL, XP_TEST_USER_A_PASSWORD
 *   XP_TEST_USER_B_EMAIL, XP_TEST_USER_B_PASSWORD
 * The project must have supabase/schema.sql applied. No service-role key is used.
 *
 * Run: npx tsx test/phase4SupabaseLive.test.ts
 *      (XP_REQUIRE_LIVE_SUPABASE=1 makes a missing configuration a failure)
 */

import assert from 'assert';
import crypto from 'crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const REQUIRED = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'XP_TEST_USER_A_EMAIL',
  'XP_TEST_USER_A_PASSWORD',
  'XP_TEST_USER_B_EMAIL',
  'XP_TEST_USER_B_PASSWORD',
];

let passed = 0;
let failed = 0;
async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    console.log(`  ✗ ${name}\n      ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function signIn(email: string, password: string): Promise<{ client: SupabaseClient; id: string }> {
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw new Error(`sign-in failed for ${email}: ${error?.message}`);
  return { client, id: data.user.id };
}

async function main() {
  console.log('==========================================================');
  console.log('PHASE 4 — HOSTED SUPABASE TWO-USER VERIFICATION');
  console.log('==========================================================');
  const missing = REQUIRED.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.log(`BLOCKED: missing ${missing.join(', ')}. No hosted-Supabase result is claimed.`);
    console.log('PHASE 4 LIVE SUPABASE SUMMARY: 0 passed, 0 failed (BLOCKED)');
    if (process.env.XP_REQUIRE_LIVE_SUPABASE === '1') process.exit(1);
    return;
  }

  const A = await signIn(process.env.XP_TEST_USER_A_EMAIL!, process.env.XP_TEST_USER_A_PASSWORD!);
  const B = await signIn(process.env.XP_TEST_USER_B_EMAIL!, process.env.XP_TEST_USER_B_PASSWORD!);
  assert.notStrictEqual(A.id, B.id, 'two distinct users');
  const tag = crypto.randomBytes(6).toString('hex');
  const sessionId = `sess_live_${tag}`;
  const questId = `qa_live_${tag}`;
  const memoryId = `m_live_${tag}`;
  const jobId = `job_live_${tag}`;

  try {
    await test('A creates owned records (session, quest attempt, memory, job)', async () => {
      const r1 = await A.client.from('classroom_sessions').insert({ session_id: sessionId, user_id: A.id, concept_id: 'periodic_table', current_stage: 'INTRO', state_json: { ownerId: A.id } });
      const r2 = await A.client.from('quest_attempts').insert({ id: questId, user_id: A.id, concept_id: 'periodic_table', is_correct: true });
      const r3 = await A.client.from('xira_memories').insert({ id: memoryId, user_id: A.id, concept_id: 'periodic_table', concept_name: 'Periodic Table', category: 'recurring_error' });
      const r4 = await A.client.from('generation_jobs').insert({ job_id: jobId, user_id: A.id, concept_id: 'periodic_table', status: 'completed' });
      for (const r of [r1, r2, r3, r4]) assert.ok(!r.error, r.error?.message);
    });

    await test('A can read A\'s data', async () => {
      const { data } = await A.client.from('classroom_sessions').select('session_id').eq('session_id', sessionId);
      assert.strictEqual(data?.length, 1);
    });

    await test('B cannot read A\'s session, attempts, memories, jobs or passport snapshots', async () => {
      for (const [table, col, id] of [
        ['classroom_sessions', 'session_id', sessionId],
        ['quest_attempts', 'id', questId],
        ['xira_memories', 'id', memoryId],
        ['generation_jobs', 'job_id', jobId],
      ] as const) {
        const { data, error } = await B.client.from(table).select('*').eq(col, id);
        assert.ok(!error, error?.message);
        assert.strictEqual(data?.length ?? 0, 0, `${table} leaked to B`);
      }
      const { data: snaps } = await B.client.from('passport_snapshots').select('id').eq('user_id', A.id);
      assert.strictEqual(snaps?.length ?? 0, 0);
      const { data: feedback } = await B.client.from('feedback').select('id');
      assert.strictEqual(feedback?.length ?? 0, 0, 'feedback is never readable');
    });

    await test('B cannot update or delete A\'s session (row unchanged)', async () => {
      await B.client.from('classroom_sessions').update({ current_stage: 'PWNED' }).eq('session_id', sessionId);
      await B.client.from('classroom_sessions').delete().eq('session_id', sessionId);
      const { data } = await A.client.from('classroom_sessions').select('current_stage').eq('session_id', sessionId);
      assert.strictEqual(data?.[0]?.current_stage, 'INTRO');
    });

    await test('B cannot create records pretending to be A', async () => {
      const r = await B.client.from('quest_attempts').insert({ id: `qa_forged_${tag}`, user_id: A.id, concept_id: 'x', is_correct: true });
      assert.ok(r.error, 'RLS must reject the insert');
      const t = await B.client.from('classroom_telemetry').insert({ session_id: sessionId, user_id: A.id, event_type: 'x', concept_id: 'x', stage: 'x', timestamp: 1 });
      assert.ok(t.error, 'telemetry attributed to A must be rejected');
    });

    await test('Shared rate limiter RPC is per-learner', async () => {
      const bucket = `live-test-${tag}`.slice(0, 64);
      const hits: boolean[] = [];
      for (let i = 0; i < 3; i++) {
        const { data, error } = await A.client.rpc('xp_rate_limit_hit', { p_bucket: bucket, p_window_seconds: 60, p_max: 2 });
        assert.ok(!error, error?.message);
        hits.push((Array.isArray(data) ? data[0] : data).allowed);
      }
      assert.deepStrictEqual(hits, [true, true, false]);
      const { data } = await B.client.rpc('xp_rate_limit_hit', { p_bucket: bucket, p_window_seconds: 60, p_max: 2 });
      assert.strictEqual((Array.isArray(data) ? data[0] : data).allowed, true);
    });
  } finally {
    await A.client.from('classroom_sessions').delete().eq('session_id', sessionId);
    await A.client.from('quest_attempts').delete().eq('id', questId);
    await A.client.from('xira_memories').delete().eq('id', memoryId);
    await A.client.auth.signOut();
    await B.client.auth.signOut();
  }

  console.log(`PHASE 4 LIVE SUPABASE SUMMARY: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
