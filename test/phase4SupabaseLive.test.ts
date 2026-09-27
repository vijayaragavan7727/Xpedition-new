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
 * Run: npm run test:supabase:live          (BLOCKED → exit 0, nothing claimed)
 *      npm run test:supabase:live:strict   (BLOCKED → exit 1, for release gating)
 *
 * Sections
 *   P4-1..6   original Phase 4 checks (unchanged assertions)
 *   H1        anonymous access to learner-private tables        (DATABASE_RLS_*)
 *   H2        learner A own-data operations                     (DATABASE_RLS_ALLOWED)
 *   H3        Passport / learning record (A creates a snapshot) (DATABASE_RLS_*)
 *   H4        labelled cross-learner denials                    (DATABASE_RLS_DENIED)
 * Application-level checks (session reload, visual jobs, logout/switch) live in
 * test/phase4HostedApp.spec.ts and need the app running against the test project.
 */

import assert from 'assert';
import crypto from 'crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  Ledger,
  anonClient,
  assertAllowed,
  assertMutationAffectsNothing,
  assertReadDeniedByRls,
  assertWriteRejectedByRls,
  blockedMessage,
  missingHostedVars,
} from './support/hostedSupabase';

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
  const missing = missingHostedVars();
  if (missing.length > 0 || REQUIRED.some((k) => !process.env[k])) {
    // Exact phrase kept for tooling: "BLOCKED: missing <vars>".
    console.log(`BLOCKED: missing ${missing.join(', ')}. No hosted-Supabase result is claimed.`);
    console.log(blockedMessage(missing));
    console.log('PHASE 4 LIVE SUPABASE SUMMARY: 0 passed, 0 failed (BLOCKED)');
    console.log('  database/RLS checks: 0 | application checks: 0 | allowed: 0 | denied: 0 | blocked: all | passed: 0 | failed: 0');
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
  const passportGoal = `live-learning-record-${tag}`;
  const passportShareId = crypto.randomUUID();
  let attemptId: number | null = null;
  const anon = anonClient();
  const ledger = new Ledger();

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

    // =====================================================================
    // H1. Anonymous access (no JWT): learner-private tables must be unreadable
    // =====================================================================
    await test('H1. Anonymous cannot read learner session / attempts / notes / jobs / Passport / profile rows', async () => {
      // Seed the rows H1 needs: attempts + passport snapshot (session/quest/memory/job exist from P4-1).
      const att = await A.client.from('attempts').insert({ user_id: A.id, correct: true }).select('id').single();
      assert.ok(!att.error, att.error?.message);
      attemptId = Number((att.data as { id: number }).id);
      const snap = await A.client.from('passport_snapshots').insert({
        user_id: A.id,
        share_id: passportShareId,
        goal_title: passportGoal,
        skills_json: [{ conceptId: 'periodic_table', mastery: 0.4 }],
        overall_readiness: 0.4,
        // Placeholder column value only: Xpedition Passports are NOT signed credentials.
        signature: 'unsigned-internal-learning-record',
      });
      assert.ok(!snap.error, snap.error?.message);

      await assertReadDeniedByRls(ledger, 'H1.1 anon → A classroom_sessions row', A.client, anon, 'classroom_sessions', 'session_id', sessionId);
      await assertReadDeniedByRls(ledger, 'H1.2 anon → A quest_attempts row', A.client, anon, 'quest_attempts', 'id', questId);
      await assertReadDeniedByRls(ledger, 'H1.3 anon → A attempts row', A.client, anon, 'attempts', 'id', String(attemptId));
      await assertReadDeniedByRls(ledger, 'H1.4 anon → A xira_memories (notes) row', A.client, anon, 'xira_memories', 'id', memoryId);
      await assertReadDeniedByRls(ledger, 'H1.5 anon → A generation_jobs row', A.client, anon, 'generation_jobs', 'job_id', jobId);
      await assertReadDeniedByRls(ledger, 'H1.6 anon → A passport_snapshots (learning record)', A.client, anon, 'passport_snapshots', 'share_id', passportShareId);
      await assertReadDeniedByRls(ledger, 'H1.7 anon → A profiles row', A.client, anon, 'profiles', 'id', A.id);
      // Anonymous cannot use the learner rate limiter at all (EXECUTE revoked from anon).
      await assertWriteRejectedByRls(ledger, 'H1.8 anon → xp_rate_limit_hit RPC', () =>
        anon.rpc('xp_rate_limit_hit', { p_bucket: `live-anon-${tag}`, p_window_seconds: 60, p_max: 1 })
      );
      // Anonymous cannot write learner rows.
      await assertWriteRejectedByRls(ledger, 'H1.9 anon → insert quest_attempts as A', () =>
        anon.from('quest_attempts').insert({ id: `qa_anon_${tag}`, user_id: A.id, concept_id: 'x', is_correct: true })
      );
      assert.strictEqual(ledger.summary().failed, 0, 'see ledger');
    });

    // =====================================================================
    // H2. Learner A: legitimate own-data operations succeed
    // =====================================================================
    await test('H2. Learner A reads/updates own session, reads own attempts, reads/writes own notes', async () => {
      const before = ledger.summary().failed;
      await assertAllowed(ledger, 'H2.1 A reads own classroom_sessions row', () =>
        A.client.from('classroom_sessions').select('session_id,user_id').eq('session_id', sessionId), (d) =>
        Array.isArray(d) && d.length === 1 && (d[0] as { user_id: string }).user_id === A.id);
      await assertAllowed(ledger, 'H2.2 A updates own classroom_sessions row', () =>
        A.client.from('classroom_sessions').update({ stage_index: 1 }).eq('session_id', sessionId).select('stage_index'), (d) =>
        Array.isArray(d) && d.length === 1 && (d[0] as { stage_index: number }).stage_index === 1);
      await assertAllowed(ledger, 'H2.3 A reads own attempts row', () =>
        A.client.from('attempts').select('id,user_id').eq('id', attemptId!), (d) => Array.isArray(d) && d.length === 1);
      await assertAllowed(ledger, 'H2.4 A reads own quest_attempts row', () =>
        A.client.from('quest_attempts').select('id').eq('id', questId), (d) => Array.isArray(d) && d.length === 1);
      await assertAllowed(ledger, 'H2.5 A reads own xira_memories (notes) row', () =>
        A.client.from('xira_memories').select('id').eq('id', memoryId), (d) => Array.isArray(d) && d.length === 1);
      await assertAllowed(ledger, 'H2.6 A writes (updates) own xira_memories (notes) row', () =>
        A.client.from('xira_memories').update({ evidence_summary: `live note ${tag}` }).eq('id', memoryId).select('evidence_summary'), (d) =>
        Array.isArray(d) && d.length === 1 && (d[0] as { evidence_summary: string }).evidence_summary === `live note ${tag}`);
      await assertAllowed(ledger, 'H2.7 A reads own generation_jobs row', () =>
        A.client.from('generation_jobs').select('job_id').eq('job_id', jobId), (d) => Array.isArray(d) && d.length === 1);
      assert.strictEqual(ledger.summary().failed, before, 'see ledger');
    });

    // =====================================================================
    // H3. Passport / learning record (created by A in H1)
    // =====================================================================
    await test('H3. Learning record: A reads own snapshot; B and anon cannot read it', async () => {
      const before = ledger.summary().failed;
      await assertAllowed(ledger, 'H3.1 A reads own passport_snapshots row', () =>
        A.client.from('passport_snapshots').select('goal_title,user_id').eq('share_id', passportShareId), (d) =>
        Array.isArray(d) && d.length === 1 && (d[0] as { goal_title: string }).goal_title === passportGoal);
      await assertReadDeniedByRls(ledger, 'H3.2 B → A passport_snapshots (by share_id)', A.client, B.client, 'passport_snapshots', 'share_id', passportShareId);
      await assertReadDeniedByRls(ledger, 'H3.3 anon → A passport_snapshots (by share_id)', A.client, anon, 'passport_snapshots', 'share_id', passportShareId);
      await assertWriteRejectedByRls(ledger, 'H3.4 B → forge a learning record as A', () =>
        B.client.from('passport_snapshots').insert({ user_id: A.id, share_id: crypto.randomUUID(), goal_title: 'forged', skills_json: [], overall_readiness: 1, signature: 'x' })
      );
      await assertMutationAffectsNothing(ledger, 'H3.5 B → update A passport_snapshots', () =>
        B.client.from('passport_snapshots').update({ goal_title: 'pwned' }).eq('share_id', passportShareId).select('id')
      );
      assert.strictEqual(ledger.summary().failed, before, 'see ledger');
    });

    // =====================================================================
    // H4. Cross-learner denials, labelled by layer (all DATABASE/RLS here)
    // =====================================================================
    await test('H4. B → A: reads, updates, deletes and forgeries are denied by the DATABASE (labelled)', async () => {
      const before = ledger.summary().failed;
      await assertReadDeniedByRls(ledger, 'H4.1 B → A classroom_sessions row', A.client, B.client, 'classroom_sessions', 'session_id', sessionId);
      await assertMutationAffectsNothing(ledger, 'H4.2 B → update A classroom_sessions row', () =>
        B.client.from('classroom_sessions').update({ current_stage: 'PWNED' }).eq('session_id', sessionId).select('session_id'));
      await assertMutationAffectsNothing(ledger, 'H4.3 B → delete A classroom_sessions row', () =>
        B.client.from('classroom_sessions').delete().eq('session_id', sessionId).select('session_id'));
      await assertWriteRejectedByRls(ledger, 'H4.4 B → take over A session id via upsert', () =>
        B.client.from('classroom_sessions').upsert({ session_id: sessionId, user_id: B.id, concept_id: 'periodic_table', current_stage: 'INTRO', state_json: {} }, { onConflict: 'session_id' }));
      await assertReadDeniedByRls(ledger, 'H4.5 B → A attempts row', A.client, B.client, 'attempts', 'id', String(attemptId));
      await assertReadDeniedByRls(ledger, 'H4.6 B → A quest_attempts row', A.client, B.client, 'quest_attempts', 'id', questId);
      await assertReadDeniedByRls(ledger, 'H4.7 B → A xira_memories (notes) row', A.client, B.client, 'xira_memories', 'id', memoryId);
      await assertMutationAffectsNothing(ledger, 'H4.8 B → update A xira_memories (notes)', () =>
        B.client.from('xira_memories').update({ evidence_summary: 'pwned' }).eq('id', memoryId).select('id'));
      await assertReadDeniedByRls(ledger, 'H4.9 B → A generation_jobs row (DB layer; in-memory jobs are app-level, see phase4HostedApp.spec.ts)', A.client, B.client, 'generation_jobs', 'job_id', jobId);
      await assertWriteRejectedByRls(ledger, 'H4.10 B → insert attempts as A', () => B.client.from('attempts').insert({ user_id: A.id, correct: false }));
      await assertWriteRejectedByRls(ledger, 'H4.11 B → insert quest_attempts as A', () =>
        B.client.from('quest_attempts').insert({ id: `qa_forged2_${tag}`, user_id: A.id, concept_id: 'x', is_correct: true }));
      await assertWriteRejectedByRls(ledger, 'H4.12 B → insert telemetry attributed to A', () =>
        B.client.from('classroom_telemetry').insert({ session_id: sessionId, user_id: A.id, event_type: 'x', concept_id: 'x', stage: 'x', timestamp: 1 }));
      await assertWriteRejectedByRls(ledger, 'H4.13 B → insert generation_jobs as A', () =>
        B.client.from('generation_jobs').insert({ job_id: `job_forged_${tag}`, user_id: A.id, concept_id: 'x', status: 'queued' }));
      // Row really unchanged after B's attempts (owner view).
      const { data } = await A.client.from('classroom_sessions').select('current_stage,user_id').eq('session_id', sessionId);
      if (data?.[0]?.current_stage === 'INTRO' && data?.[0]?.user_id === A.id) ledger.record('H4.14 A session row unchanged after B attempts', 'DATABASE_RLS', 'ALLOWED', 'owner read');
      else ledger.fail('H4.14 A session row unchanged after B attempts', 'DATABASE_RLS_ALLOWED', JSON.stringify(data));
      assert.strictEqual(ledger.summary().failed, before, 'see ledger');
    });
  } finally {
    await A.client.from('classroom_sessions').delete().eq('session_id', sessionId);
    await A.client.from('passport_snapshots').delete().eq('share_id', passportShareId);
    if (attemptId !== null) await A.client.from('attempts').delete().eq('id', attemptId);
    await A.client.from('quest_attempts').delete().eq('id', questId);
    await A.client.from('xira_memories').delete().eq('id', memoryId);
    await A.client.auth.signOut();
    await B.client.auth.signOut();
  }

  const s = ledger.print('HOSTED SUPABASE — DATABASE/RLS LEDGER');
  console.log(`PHASE 4 LIVE SUPABASE SUMMARY: ${passed} passed, ${failed} failed (ledger: ${s.passed} passed, ${s.failed} failed)`);
  if (failed > 0 || s.failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
