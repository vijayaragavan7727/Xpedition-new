# Hosted Supabase Verification: Setup Runbook

Purpose: close the last Phase 4 blocker by running the two-user security verification against a **real hosted Supabase project**.

Status when this runbook was written (commit 94c43a8): **BLOCKED**. None of the six variables below were configured.

> Use a **dedicated TEST project** only. Never use production credentials: the tests write, modify and delete rows. Never commit, paste into issues, or log any value below.

## 1. What the live test reads, and from where

- Database/RLS layer: `npm run test:supabase:live` runs `npx tsx test/phase4SupabaseLive.test.ts`.
  - Missing variables → prints `BLOCKED`, exits 0 and claims nothing.
  - `npm run test:supabase:live:strict` turns BLOCKED into exit 1, for release gating.
- Application layer: `npm run test:e2e:hosted` runs `test/phase4HostedApp.spec.ts`. Missing variables → every test is skipped as BLOCKED.

The test reads **only `process.env`**. It loads no `.env` file (there is no dotenv), so the variables must be present in the shell that runs the command.

| Variable | Value | Source in the Supabase dashboard |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | the test project's API URL, `https://<project-ref>.supabase.co` | Project Settings → API (or Data API) → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the test project's **anon / publishable** key. **Never** the service-role/secret key | Project Settings → API Keys |
| `XP_TEST_USER_A_EMAIL` | learner A's email | you choose (see §4) |
| `XP_TEST_USER_A_PASSWORD` | learner A's password | you choose |
| `XP_TEST_USER_B_EMAIL` | learner B's email (a different user) | you choose |
| `XP_TEST_USER_B_PASSWORD` | learner B's password | you choose |

No service-role key is needed or accepted. Every check runs as a real signed-in learner (or anon), so Row Level Security is what is being tested.

**Where to put them:** a local, git-ignored file. `.gitignore` already ignores `.env*.local`.

```bash
# .env.test.local   (git-ignored; never commit)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
XP_TEST_USER_A_EMAIL=...
XP_TEST_USER_A_PASSWORD=...
XP_TEST_USER_B_EMAIL=...
XP_TEST_USER_B_PASSWORD=...
```

Before running, check that the file really is ignored: `git check-ignore .env.test.local` must print the file name.

Note: Next.js also reads `.env*.local` files during `next build` / `next start`. For the application-level checks in §6 that is intended: they must point at the same test project. Do not leave this file in a checkout used for production builds.

## 2. Create the dedicated test project

1. In the Supabase dashboard, create a **new project**, for example `xpedition-security-test`. Do not reuse the production project or a shared staging project that holds real learner data.
2. Wait until it is provisioned. Note the Project URL and the anon/publishable key (§1).

## 3. Apply `supabase/schema.sql`

Apply the schema **before** creating the users, so that the `on_auth_user_created` trigger provisions `profiles` and `users` rows for them.

1. Dashboard → SQL Editor → New query.
2. Paste the entire contents of `supabase/schema.sql` from the commit under test and run it once. It is written to be idempotent: `IF NOT EXISTS`, `DROP POLICY IF EXISTS`, `CREATE OR REPLACE`.
3. Sanity checks (SQL Editor):

   ```sql
   -- every public table must have RLS enabled: expect 0 rows
   select relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;

   -- the shared limiter function must exist: expect 1 row
   select proname, prosecdef from pg_proc where proname = 'xp_rate_limit_hit';
   ```

The same schema has already been verified locally against real PostgreSQL 16 (`npm run test:rls`, 19/19). That is **not** hosted evidence.

## 4. Create and confirm the two test users

1. Dashboard → Authentication → Users → **Add user → Create new user**. Create two users with different, non-personal emails. Addresses on a domain you control are best; `@example.com`-style addresses work only if the project allows unconfirmed sign-in or you auto-confirm them.
2. Tick **Auto Confirm User** when creating each user, or confirm both before running. `signInWithPassword` fails for unconfirmed users.
3. Make sure Authentication → Providers → **Email** is enabled (password sign-in).
4. Use strong, unique passwords that are used nowhere else.
5. Optional check: `select id, email from public.profiles;` should show both users. The trigger provisioned them.

## 5. Run the live verification

```bash
cd <repo>
git checkout phase-4-production-security
npm ci
set -a; source .env.test.local; set +a     # exports the six variables into this shell only
npm run test:supabase:live:strict          # §6A database/RLS layer

# §6B application layer: build and start the app against the SAME test project
npm run build
MOCK_VISUAL_GENERATION=true npx next start -p 3400 &   # mock images: ComfyUI is not configured
npm run test:e2e:hosted                    # XP_HOSTED_APP_URL overrides http://localhost:3400
```

Each run prints a ledger. Every check is labelled `DATABASE_RLS_ALLOWED`, `DATABASE_RLS_DENIED`, `APPLICATION_ALLOWED`, `APPLICATION_DENIED` or `BLOCKED`, and the run ends with counts of database/RLS, application, allowed, denied and blocked checks. The application ledger is saved to `test/artifacts/hosted-supabase/hosted-app-ledger.json`.

- Without all six variables, the command prints `BLOCKED: missing …` and exits 1. It never reports a pass.
- A pass prints `PHASE 4 LIVE SUPABASE SUMMARY: N passed, 0 failed`.

## 6. What the verification must cover

### A. Database / RLS checks: `test/phase4SupabaseLive.test.ts`

Every check calls Supabase directly with a learner's own JWT, or anon. A denial is labelled `DATABASE_RLS_DENIED` only when it is proven at the database:
- the owner can see the row, but the other actor gets 0 rows; or
- the insert/RPC is rejected with SQLSTATE 42501; or
- the update/delete affects 0 rows.

| Area | Checks |
|---|---|
| Original Phase 4 checks (unchanged) | A creates rows; A reads; B cannot read, update, delete or forge; per-learner shared rate limiter |
| H1 Anonymous | anon cannot read A's session, attempts, quest attempts, notes (`xira_memories`), `generation_jobs`, learning record, profile; anon cannot call the limiter or insert rows |
| H2 A's own data | A reads and updates own session; reads own attempts and quest attempts; reads and updates own notes; reads own job row |
| H3 Learning record | A **creates** a `passport_snapshots` row, then reads it; B and anon cannot read it; B cannot forge or update it |
| H4 Cross-learner | B read, update, delete and upsert-takeover of A's session; B read of A's attempts, notes and jobs; B forgery of attempts, quest attempts, telemetry and jobs; A's row verified unchanged |

### B. Application checks: `test/phase4HostedApp.spec.ts` (real browser, real login form)

| Test | What is verified | Layers |
|---|---|---|
| HA1 Session reload | A logs in, opens `/class`, and the server session is created. The row appears in the hosted DB with `user_id = A`. After a reload the session is still A's and A can still drive it through the API. For B, the API returns 404 and the DB returns 0 rows or 0 affected. Anon reads 0 rows | APPLICATION_ALLOWED/DENIED plus DATABASE_RLS_ALLOWED/DENIED |
| HA2 Visual job | A creates a job, reads its status and gets the private image. B's status, query and image requests get 404; anon's image request gets 401. **Jobs are in app memory, so this is application-level only.** The database layer for `generation_jobs` is H4.9/H4.13 above | APPLICATION only |
| HA3 Logout/switch (390×844 and 1440×900) | A logs in, a session and learning record are created, and local state is added. A signs out: no A keys remain and the Class is in guest mode. B logs in on the same browser: `/class`, `/home`, `/passport` and `/progress` show none of A's data or email, and `localStorage` has none of A's keys. B's DB reads of A's record and session are denied | APPLICATION_DENIED plus DATABASE_RLS_DENIED |

The login step checks that the browser received the `sb-<project-ref>-auth-token` cookie for the configured test project. This proves the app under test is using that project.

## 7. Clean up afterwards

- The tests delete the session, quest-attempt, attempt, memory and learning-record rows they created.
- Learners cannot delete `generation_jobs` or `rate_limit_hits` rows (there are no policies for that, by design). Remove them in the SQL Editor:

  ```sql
  delete from public.generation_jobs where job_id like 'job_live_%';
  delete from public.rate_limit_hits where bucket like 'live-%';
  ```

- Then either:
  - **Delete the whole test project** (recommended): Project Settings → General → Delete project. This removes users, data and keys; or
  - keep the project and delete both users (Authentication → Users → Delete user; `ON DELETE CASCADE` removes their rows), and rotate the anon key if it was ever shared.
- Delete `.env.test.local` from the machine, or at least remove the passwords from it.

## 8. What counts as "hosted verification passed"

Only a run of the §6A and §6B checks against the hosted test project, with 0 failures and the output kept as evidence. Local PostgreSQL results, the browser tests against the local login stand-in, and unit tests do **not** count as hosted verification.
