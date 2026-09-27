# Hosted Supabase Verification: Setup Runbook

Purpose: close the last Phase 4 blocker by running the two-user security verification against a **real hosted Supabase project**.

Status when this runbook was written (commit 94c43a8): **BLOCKED**. None of the six variables below were configured.

> Use a **dedicated TEST project** only. Never use production credentials: the tests write, modify and delete rows. Never commit, paste into issues, or log any value below.

## 1. What the live test reads, and from where

`npm run test:supabase:live` runs `XP_REQUIRE_LIVE_SUPABASE=1 npx tsx test/phase4SupabaseLive.test.ts`.

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
npm run test:supabase:live
```

- Without all six variables, the command prints `BLOCKED: missing …` and exits 1. It never reports a pass.
- A pass prints `PHASE 4 LIVE SUPABASE SUMMARY: N passed, 0 failed`.

## 6. What the verification must cover

### A. Database / RLS checks (the existing live test, run with each learner's own JWT)

| Area | Covered by `test/phase4SupabaseLive.test.ts` today | Still to add before sign-off |
|---|---|---|
| A creates owned rows (session, quest attempt, memory, visual job) | yes | – |
| A reads own session | yes | A updates own session; A reads own attempts and notes |
| B read of A's session / attempts / notes (memories) / visual jobs | yes | – |
| B update/delete of A's session (row unchanged) | yes | – |
| B forging rows as A (quest attempt, telemetry) | yes | – |
| Passport / learning record | only "B reads A's snapshots → 0". **Vacuous today: A never creates one** | A inserts a snapshot; A reads it; B and anon get 0 |
| Anonymous access to learner-private tables | **not covered** | an anon client reads every learner table → 0 rows or refused |
| Shared rate limiter (per learner, shared) | yes | – |
| Labelling | – | every denial labelled **DATABASE/RLS DENIED** |

### B. Application-level checks (app running against the hosted test project)

These need the app built and started with the test project's variables:

```bash
set -a; source .env.test.local; set +a
npm run build && npx next start -p 3300
```

Each check is labelled **APPLICATION DENIED** (Xpedition route/owner check) or **DATABASE/RLS DENIED**.

1. **Session reload.** A signs in, opens `/class?concept=periodic_table`, and the session is created (`data-persistence="server_session"`). A reloads and the session is still A's. The row in `classroom_sessions` has `user_id = A`, confirmed by reading it as A. B posting to `/api/classroom/session` with A's `sessionId` → **404 (application)**. B selecting that row directly → **0 rows (RLS)**.
2. **Visual-job ownership.**
   - A: `POST /api/visual-generation` → job owned by A. `GET /api/visual-generation/<id>` and `/asset` return 200 for A.
   - B: the same URLs → **404 (application)**.
   - Anonymous: → **401 (application)**.
   - Needs `MOCK_VISUAL_GENERATION=true` on the test server, because ComfyUI is not configured.
   - Jobs live in the app process, not in Supabase (see `lib/security/stateInventory.ts`), so this check is application-level only. The `generation_jobs` table check in §A is the RLS layer.
3. **Logout/switch.** In a real browser: A signs in with the real login form → learner state exists → A signs out → B signs in → none of A's session, notes, progress or local learner state is visible, and no `__u_<A id>` / `xpedition_user_<A id>` keys remain in `localStorage`.

§6A's "still to add" items and all of §6B are **test code only**. They are to be added with your approval; no application code or schema changes are required.

## 7. Clean up afterwards

- The live test deletes the session, quest-attempt and memory rows it created.
- Learners cannot delete `generation_jobs` or `rate_limit_hits` rows (there are no policies for that, by design). Remove them in the SQL Editor:

  ```sql
  delete from public.generation_jobs where job_id like 'job_live_%';
  delete from public.rate_limit_hits where bucket like 'live-test-%';
  ```

- Then either:
  - **Delete the whole test project** (recommended): Project Settings → General → Delete project. This removes users, data and keys; or
  - keep the project and delete both users (Authentication → Users → Delete user; `ON DELETE CASCADE` removes their rows), and rotate the anon key if it was ever shared.
- Delete `.env.test.local` from the machine, or at least remove the passwords from it.

## 8. What counts as "hosted verification passed"

Only a run of the §6A and §6B checks against the hosted test project, with 0 failures and the output kept as evidence. Local PostgreSQL results, the browser tests against the local login stand-in, and unit tests do **not** count as hosted verification.
