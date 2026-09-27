/**
 * PHASE 4 — DATABASE-LEVEL RLS VERIFICATION (real PostgreSQL 16)
 *
 * Loads the real supabase/schema.sql into a real PostgreSQL server with a
 * Supabase-compatible auth shim and runs every statement AS learner A, learner B
 * or anon — the way PostgREST does (request role + JWT claims). Application code
 * is not involved: these tests prove that the DATABASE rejects cross-learner
 * access, not that the app merely hides it.
 *
 * Scope honesty: this is real PostgreSQL + the real schema, NOT hosted Supabase
 * (no GoTrue, no PostgREST, no Storage). The hosted two-user test is
 * test/phase4SupabaseLive.test.ts and needs real credentials.
 *
 * Run: npx tsx test/phase4Rls.pg.test.ts
 */

import assert from 'assert';
import {
  createDatabase,
  dropDatabase,
  ensureServer,
  pgUnavailableReason,
  runAs,
  type Actor,
  type PgTarget,
} from './support/pgRlsHarness';

const A = '0000000a-0000-4000-8000-00000000000a';
const B = '0000000b-0000-4000-8000-00000000000b';
const asA: Actor = { kind: 'user', id: A };
const asB: Actor = { kind: 'user', id: B };
const anon: Actor = { kind: 'anon' };
const su: Actor = { kind: 'superuser' };

let passed = 0;
let failed = 0;
const failures: string[] = [];
async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    const msg = err instanceof Error ? err.message : String(err);
    failures.push(`${name}: ${msg}`);
    console.log(`  ✗ ${name}\n      ${msg}`);
  }
}

function ok(db: PgTarget, actor: Actor, sql: string): string[] {
  const r = runAs(db, actor, sql);
  assert.ok(r.ok, `expected success, got ${r.error}`);
  return r.rows;
}

/** The statement must be REJECTED by the database (RLS / privilege), not silently succeed. */
function denied(db: PgTarget, actor: Actor, sql: string, codes = ['42501']) {
  const r = runAs(db, actor, sql);
  assert.ok(!r.ok, `expected the database to reject: ${sql}`);
  assert.ok(codes.includes(r.sqlstate || ''), `expected SQLSTATE ${codes.join('/')} got ${r.sqlstate} (${r.error})`);
}

function count(db: PgTarget, actor: Actor, sql: string): number {
  const rows = ok(db, actor, sql);
  return Number(rows[rows.length - 1]);
}

async function main() {
  console.log('==========================================================');
  console.log('PHASE 4 — REAL POSTGRESQL RLS (schema.sql + Supabase auth shim)');
  console.log('==========================================================');

  const reason = pgUnavailableReason();
  if (reason) {
    const msg = `BLOCKED: real PostgreSQL unavailable (${reason}). No RLS result is claimed.`;
    console.log(msg);
    if (process.env.XP_REQUIRE_PG === '1') process.exit(1);
    console.log('PHASE 4 RLS SUMMARY: 0 passed, 0 failed (BLOCKED)');
    return;
  }

  const server = ensureServer();
  const dbName = `xp_rls_${process.pid}`;
  const db = createDatabase(server, dbName);

  try {
    ok(db, su, `INSERT INTO auth.users (id, email) VALUES ('${A}', 'a@test.invalid'), ('${B}', 'b@test.invalid');`);

    console.log('\nR0. Schema posture');
    await test('R0.1 every public table has RLS enabled', () => {
      const rows = ok(db, su, `SELECT relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity;`);
      assert.deepStrictEqual(rows, []);
    });
    await test('R0.2 learner tables have no USING(true)/WITH CHECK(true) policies (only curriculum modules + anonymous feedback insert)', () => {
      const rows = ok(db, su, `SELECT tablename || ':' || cmd FROM pg_policies WHERE schemaname = 'public'
        AND (qual = 'true' OR with_check = 'true') ORDER BY 1;`);
      assert.deepStrictEqual(rows, ['feedback:INSERT', 'modules:SELECT']);
    });

    console.log('\nR1. Class sessions (classroom_sessions)');
    await test('R1.1 A can INSERT own session; INSERT attributed to B is rejected', () => {
      ok(db, asA, `INSERT INTO public.classroom_sessions (session_id, user_id, concept_id, current_stage, state_json)
        VALUES ('sess_A1', '${A}', 'periodic_table', 'INTRO', '{"ownerId":"${A}"}');`);
      denied(db, asA, `INSERT INTO public.classroom_sessions (session_id, user_id, concept_id, current_stage, state_json)
        VALUES ('sess_forged', '${B}', 'periodic_table', 'INTRO', '{}');`);
    });
    await test('R1.2 B cannot SELECT A\'s session (by id or by listing)', () => {
      assert.strictEqual(count(db, asB, `SELECT count(*) FROM public.classroom_sessions WHERE session_id = 'sess_A1';`), 0);
      assert.strictEqual(count(db, asB, `SELECT count(*) FROM public.classroom_sessions;`), 0);
    });
    await test('R1.3 B cannot UPDATE or DELETE A\'s session (0 rows affected; row unchanged)', () => {
      assert.deepStrictEqual(ok(db, asB, `UPDATE public.classroom_sessions SET current_stage = 'PWNED' WHERE session_id = 'sess_A1' RETURNING session_id;`), []);
      assert.deepStrictEqual(ok(db, asB, `DELETE FROM public.classroom_sessions WHERE session_id = 'sess_A1' RETURNING session_id;`), []);
      assert.deepStrictEqual(ok(db, su, `SELECT current_stage FROM public.classroom_sessions WHERE session_id = 'sess_A1';`), ['INTRO']);
    });
    await test('R1.4 B cannot take over A\'s session id via upsert (ON CONFLICT) or re-assign ownership', () => {
      denied(db, asB, `INSERT INTO public.classroom_sessions (session_id, user_id, concept_id, current_stage, state_json)
        VALUES ('sess_A1', '${B}', 'periodic_table', 'INTRO', '{}')
        ON CONFLICT (session_id) DO UPDATE SET user_id = EXCLUDED.user_id, state_json = EXCLUDED.state_json;`);
      denied(db, asA, `UPDATE public.classroom_sessions SET user_id = '${B}' WHERE session_id = 'sess_A1';`);
      assert.deepStrictEqual(ok(db, su, `SELECT user_id FROM public.classroom_sessions WHERE session_id = 'sess_A1';`), [A]);
    });
    await test('R1.5 A can SELECT, UPDATE and DELETE own session; anon sees nothing', () => {
      assert.strictEqual(count(db, anon, `SELECT count(*) FROM public.classroom_sessions;`), 0);
      assert.deepStrictEqual(ok(db, asA, `UPDATE public.classroom_sessions SET current_stage = 'EXPLAIN' WHERE session_id = 'sess_A1' RETURNING current_stage;`), ['EXPLAIN']);
      ok(db, asA, `INSERT INTO public.classroom_sessions (session_id, user_id, concept_id, current_stage, state_json)
        VALUES ('sess_A2', '${A}', 'calculus_derivatives', 'INTRO', '{}');`);
      assert.deepStrictEqual(ok(db, asA, `DELETE FROM public.classroom_sessions WHERE session_id = 'sess_A2' RETURNING session_id;`), ['sess_A2']);
      assert.strictEqual(count(db, asA, `SELECT count(*) FROM public.classroom_sessions;`), 1);
    });
    await test('R1.6 B\'s own session works for B and is invisible to A', () => {
      ok(db, asB, `INSERT INTO public.classroom_sessions (session_id, user_id, concept_id, current_stage, state_json)
        VALUES ('sess_B1', '${B}', 'polymorphism', 'INTRO', '{}');`);
      assert.strictEqual(count(db, asB, `SELECT count(*) FROM public.classroom_sessions;`), 1);
      assert.strictEqual(count(db, asA, `SELECT count(*) FROM public.classroom_sessions WHERE session_id = 'sess_B1';`), 0);
    });

    console.log('\nR2. Attempts (attempts, quest_attempts)');
    await test('R2.1 attempts: B cannot read A\'s; B cannot create an attempt as A', () => {
      ok(db, asA, `INSERT INTO public.attempts (user_id, correct) VALUES ('${A}', true);`);
      assert.strictEqual(count(db, asB, `SELECT count(*) FROM public.attempts;`), 0);
      assert.strictEqual(count(db, asA, `SELECT count(*) FROM public.attempts;`), 1);
      denied(db, asB, `INSERT INTO public.attempts (user_id, correct) VALUES ('${A}', false);`);
      assert.deepStrictEqual(ok(db, asB, `UPDATE public.attempts SET correct = false RETURNING id;`), []);
    });
    await test('R2.2 quest_attempts: B cannot read, forge or modify A\'s', () => {
      ok(db, asA, `INSERT INTO public.quest_attempts (id, user_id, concept_id, is_correct) VALUES ('qa_A1', '${A}', 'periodic_table', true);`);
      assert.strictEqual(count(db, asB, `SELECT count(*) FROM public.quest_attempts;`), 0);
      denied(db, asB, `INSERT INTO public.quest_attempts (id, user_id, concept_id, is_correct) VALUES ('qa_forged', '${A}', 'periodic_table', true);`);
      assert.deepStrictEqual(ok(db, asB, `UPDATE public.quest_attempts SET is_correct = false WHERE id = 'qa_A1' RETURNING id;`), []);
      assert.deepStrictEqual(ok(db, asB, `DELETE FROM public.quest_attempts WHERE id = 'qa_A1' RETURNING id;`), []);
    });

    console.log('\nR3. Notes / Xira memory, feedback, Passport, learner state');
    await test('R3.1 xira_memories (server-side learner notes/memory): owner-only', () => {
      ok(db, asA, `INSERT INTO public.xira_memories (id, user_id, concept_id, concept_name, category) VALUES ('m_A1', '${A}', 'periodic_table', 'Periodic Table', 'recurring_error');`);
      assert.strictEqual(count(db, asB, `SELECT count(*) FROM public.xira_memories;`), 0);
      denied(db, asB, `INSERT INTO public.xira_memories (id, user_id, concept_id, concept_name, category) VALUES ('m_forged', '${A}', 'x', 'x', 'recurring_error');`);
    });
    await test('R3.2 feedback: insert-only; nobody (A, B or anon) can read anyone\'s feedback', () => {
      ok(db, asA, `INSERT INTO public.feedback (rating, body) VALUES (5, 'A private feedback');`);
      for (const actor of [asA, asB, anon]) assert.strictEqual(count(db, actor, `SELECT count(*) FROM public.feedback;`), 0);
    });
    await test('R3.3 passport_snapshots (Passport/evidence): no public read; B and anon cannot read A\'s', () => {
      ok(db, asA, `INSERT INTO public.passport_snapshots (user_id, share_id, goal_title, skills_json, overall_readiness, signature)
        VALUES ('${A}', gen_random_uuid(), 'A goal', '[]', 0.4, 'none');`);
      assert.strictEqual(count(db, asB, `SELECT count(*) FROM public.passport_snapshots;`), 0);
      assert.strictEqual(count(db, anon, `SELECT count(*) FROM public.passport_snapshots;`), 0);
      assert.strictEqual(count(db, asA, `SELECT count(*) FROM public.passport_snapshots;`), 1);
    });
    await test('R3.4 learner state (profiles, learner_profile, game_state, mastery): owner-only', () => {
      // handle_new_user() already created A's and B's profile rows at sign-up.
      assert.strictEqual(count(db, asA, `SELECT count(*) FROM public.profiles;`), 1);
      assert.deepStrictEqual(ok(db, asB, `UPDATE public.profiles SET display_name = 'pwned' WHERE id = '${A}' RETURNING id;`), []);
      ok(db, asA, `INSERT INTO public.game_state (user_id, xp) VALUES ('${A}', 120);`);
      assert.strictEqual(count(db, asB, `SELECT count(*) FROM public.profiles WHERE id = '${A}';`), 0);
      assert.deepStrictEqual(ok(db, asB, `SELECT id FROM public.profiles;`), [B], 'B sees only B');
      assert.strictEqual(count(db, asB, `SELECT count(*) FROM public.game_state;`), 0);
      assert.strictEqual(count(db, anon, `SELECT count(*) FROM public.profiles;`), 0);
      denied(db, asB, `INSERT INTO public.game_state (user_id, xp) VALUES ('${A}', 999999) ON CONFLICT (user_id) DO UPDATE SET xp = EXCLUDED.xp;`);
      assert.deepStrictEqual(ok(db, su, `SELECT xp FROM public.game_state WHERE user_id = '${A}';`), ['120']);
    });
    await test('R3.5 goal skills are learner data: B and anon cannot read A\'s (public-read policy removed)', () => {
      const goal = ok(db, asA, `INSERT INTO public.goals (user_id, goal_text, title) VALUES ('${A}', 'learn chemistry', 'Chem') RETURNING id;`)[0];
      ok(db, asA, `INSERT INTO public.skills (goal_id, name) VALUES ('${goal}', 'Periodic trends');`);
      assert.strictEqual(count(db, asA, `SELECT count(*) FROM public.skills;`), 1);
      assert.strictEqual(count(db, asB, `SELECT count(*) FROM public.skills;`), 0);
      assert.strictEqual(count(db, anon, `SELECT count(*) FROM public.skills;`), 0);
      denied(db, asB, `INSERT INTO public.skills (goal_id, name) VALUES ('${goal}', 'injected');`);
    });

    console.log('\nR4. Visual-generation jobs and telemetry');
    await test('R4.1 generation_jobs: B cannot read A\'s job or create one as A; nobody can update jobs', () => {
      const cols = ok(db, su, `SELECT string_agg(column_name, ',' ORDER BY ordinal_position) FROM information_schema.columns WHERE table_schema='public' AND table_name='generation_jobs';`)[0];
      assert.ok(cols.includes('user_id'), `generation_jobs has user_id (${cols})`);
      ok(db, asA, `INSERT INTO public.generation_jobs (job_id, user_id, concept_id, status) VALUES ('job_A1', '${A}', 'periodic_table', 'completed');`);
      assert.strictEqual(count(db, asB, `SELECT count(*) FROM public.generation_jobs;`), 0);
      assert.strictEqual(count(db, asA, `SELECT count(*) FROM public.generation_jobs;`), 1);
      denied(db, asB, `INSERT INTO public.generation_jobs (job_id, user_id, concept_id, status) VALUES ('job_forged', '${A}', 'x', 'queued');`);
      assert.deepStrictEqual(ok(db, asA, `UPDATE public.generation_jobs SET status = 'x' RETURNING job_id;`), []);
    });
    await test('R4.2 classroom_telemetry: a learner can no longer write telemetry attributed to another learner', () => {
      ok(db, asA, `INSERT INTO public.classroom_telemetry (session_id, user_id, event_type, concept_id, stage, timestamp) VALUES ('sess_A1', '${A}', 'x', 'periodic_table', 'INTRO', 1);`);
      denied(db, asB, `INSERT INTO public.classroom_telemetry (session_id, user_id, event_type, concept_id, stage, timestamp) VALUES ('sess_A1', '${A}', 'x', 'periodic_table', 'INTRO', 1);`);
      assert.strictEqual(count(db, asB, `SELECT count(*) FROM public.classroom_telemetry;`), 0);
    });

    console.log('\nR5. Shared per-learner rate limit (xp_rate_limit_hit)');
    await test('R5.1 anon cannot use the limiter; learners cannot read/write the hits table directly', () => {
      denied(db, anon, `SELECT * FROM public.xp_rate_limit_hit('classroom-session', 60, 3);`);
      denied(db, asA, `SELECT count(*) FROM public.rate_limit_hits;`);
      denied(db, asA, `INSERT INTO public.rate_limit_hits (user_id, bucket) VALUES ('${B}', 'classroom-session');`);
    });
    await test('R5.2 counts are shared across connections (instances) and keyed by auth.uid()', () => {
      const hit = (actor: Actor) => ok(db, actor, `SELECT allowed FROM public.xp_rate_limit_hit('classroom-session', 60, 3);`)[0];
      // Each runAs is a separate psql process/connection, i.e. a separate "instance".
      assert.deepStrictEqual([hit(asA), hit(asA), hit(asA), hit(asA)], ['t', 't', 't', 'f']);
      assert.strictEqual(hit(asB), 't', 'B has an independent bucket; A cannot exhaust B');
      denied(db, asA, `SELECT * FROM public.xp_rate_limit_hit('bad bucket!', 60, 3);`, ['22023']);
    });
  } finally {
    dropDatabase(server, dbName);
  }

  console.log('\n==========================================================');
  console.log(`PHASE 4 RLS SUMMARY: ${passed} passed, ${failed} failed`);
  console.log('==========================================================');
  if (failed > 0) {
    failures.forEach((f) => console.log(` - ${f}`));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
