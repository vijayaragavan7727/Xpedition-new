# Phase 4: Production Security Closure and Supabase Verification

Status: **not production-ready.** The hosted Supabase two-user verification is BLOCKED because no Supabase project or test-user credentials were available in this environment. The rest of this document says exactly what was and was not verified.

Evidence levels used below:
- **real PostgreSQL RLS**: the real `supabase/schema.sql` was loaded into a real PostgreSQL 16 server with a Supabase-compatible auth shim. Every statement ran as learner A, learner B or anon, the way PostgREST runs them (request role plus JWT claims).
- **browser (stub auth)**: the real production build ran in Chromium against a local GoTrue/PostgREST *stub*. This proves the app's behaviour, not Supabase's.
- **unit/mocks**: deterministic Node tests.
- **hosted Supabase**: BLOCKED (not run).

## 1. Audit (before modification)

### A/B/C. Learner tables, routes and authorization

| Data | Table | Reached by | Auth required | Ownership condition | RLS policy | Client used (before → after) | Learner-supplied id? |
|---|---|---|---|---|---|---|---|
| Class sessions | `classroom_sessions` | `POST /api/classroom/session` (create/process). Server only; no read/delete endpoint | `requireServerAuth` → 401/503 | orchestrator + store filter `ownerId === requester` | `FOR ALL USING/WITH CHECK auth.uid() = user_id` | anon singleton on the server (RLS rejected every write, so data silently stayed in per-instance memory) → request-scoped learner client | `sessionId`. Owner-checked, 404 otherwise |
| Class telemetry | `classroom_telemetry` | (no route writes it today) | – | – | INSERT `auth.uid() = user_id` (**fixed**; it previously also accepted any signed-in role) | – | – |
| Attempts | `attempts`, `quest_attempts` | `POST /api/user/attempt`; `/history` page (browser client) | yes | `userId` from the session, never from the body | owner-only `FOR ALL` | anon singleton on the server → learner client | no |
| Notes / Xira memory | `xira_memories` (server); Class notes are local-only (learner-scoped keys) | `/api/user/memory` | yes | session user | owner-only | anon singleton → learner client | no |
| Feedback | `feedback` | `FeedbackSheet` (browser client) | no (anonymous by design) | no user column | INSERT `true`; **no SELECT policy**, so nobody can read it | browser client | no |
| Passport / evidence | `passport_snapshots` (not written by the app today); evidence is computed client-side | – | – | – | owner-only (public read removed in Phase 3) | – | no |
| Learner state | `profiles`, `learner_profile`, `game_state`, `mastery`, `goals`, `skills` | `/api/user/state`, `/export`, `/delete`, onboarding (browser) | yes | session user | owner-only. **`skills` had a public `USING (true)` read that exposed every learner's goal skills; removed** | anon singleton → learner client | no |
| Visual jobs | in-memory `GenerationJobStore` (the `generation_jobs` table is unused) | `POST/GET /api/visual-generation`, `GET /api/visual-generation/[jobId]` | yes | **none before Phase 4 (IDOR)**. Now `job.ownerId === requester` | table: owner-only SELECT/INSERT | – | `jobId`. Owner-checked, 404 otherwise |

No route used a service-role key. `productionConfig` read `SUPABASE_SERVICE_ROLE_KEY` but never used it; the read has been removed.

### D. Visual-generation job lifecycle (before → after)

| Step | Before | After |
|---|---|---|
| create `POST /api/visual-generation` | no owner. The shared cache meant learner B could join learner A's in-flight job and receive A's `jobId`/`requestId`. The response returned `publicUrl`, `metadata`, `cacheKey` and the prompt-bearing asset | job has `ownerId`. The cache key is salted per owner (no joining or reuse across learners). The response is `toClientJob()`: no prompt, request, metadata, cache key, storage path or static URL |
| status `GET ?jobId=` / `GET /[jobId]` | any authenticated user could read any job | `getJobForOwner` → 404 unless it is the requester's job |
| result / asset | written to `public/generated-visuals/` and served statically, **no auth**. `assets-manifest.json` (prompts plus internal paths) was publicly served (HTTP 200) | learner outputs go to a private directory outside `public/` and are served only by `GET /api/visual-generation/[jobId]/asset` (auth + owner, `private, no-store`, path-traversal guard). The manifest returns 404 |
| delete / cancel | not present | not present (nothing to secure) |

Curriculum assets that ship in `public/generated-visuals/` stay public by design. They are shared curriculum material with no learner input.

### E. OpenMAIC bridge (and Canvas)

| Call | Before | After |
|---|---|---|
| `POST {bridge}/scene`, `POST {bridge}/action` | plain `fetch`, **no timeout** (a hung bridge held the server request open indefinitely). Errors became a generic 502 | `fetchJsonWithTimeout`: one AbortController deadline covering headers *and* body. Default 2500 ms (below the Class client's 3000 ms), `XPEDITION_OPENMAIC_TIMEOUT_MS` clamped to 250–20000 ms. On timeout: `UpstreamTimeoutError` → deterministic `504 PROVIDER_TIMEOUT`, and the Class keeps its native visual |
| Canvas REST | no timeout | same bounded helper (`CANVAS_TIMEOUT_MS`, default 8000 ms) |

## 2. Threat model (summary)

| Actor | Goal | Control |
|---|---|---|
| Anonymous visitor | reach learner data or APIs | fail-closed auth (503 without Supabase, 401 without a session). RLS denies `anon` everything except the curriculum `modules` and anonymous feedback INSERT |
| Learner B | read, modify or forge learner A's data | server: owner checks on sessions, jobs and assets. Database: RLS `auth.uid() = user_id` (verified in real PostgreSQL). Canvas: signed learner-bound handles |
| Learner B | abuse the school Canvas credential | allow-listed actions only, server-rebuilt context, handle-bound conversations, projected responses, generic errors |
| Anyone | exhaust expensive routes across instances | shared per-learner limiter in Postgres (`xp_rate_limit_hit`) |
| Next user on a shared device | see the previous learner's local data | purge on logout and on any identity change, no global key, memory-only guest mode |
| Hung upstream | tie up server capacity | hard deadlines with abort |

## 3. Boundaries

**Auth boundary.** `resolveAuthMode` returns `supabase`, `dev_local` (only with `NODE_ENV=development` plus `NEXT_PUBLIC_XPEDITION_DEV_AUTH_BYPASS=1`) or `unavailable`. `unavailable` gives 503 APIs, protected-route redirects and no fake learner. `next start` always runs with `NODE_ENV=production`, so the bypass can never apply there.

**Supabase/RLS boundary.** Server code reaches learner tables only through `getLearnerDb()`. In the browser that is the signed-in client. On the server it is a request-scoped client built from the caller's auth cookies with the anon key (`lib/supabase/serverDb.ts`), so PostgREST evaluates RLS as the requester. The anon singleton is never used on the server, and no service-role key exists in the code path. Application checks run first; RLS is the second, independent layer.

**Canvas credential boundary.**

```
Xpedition identity (Supabase session)
  → Xpedition authorization (allow-list, learner-bound signed handles)
    → server-side Canvas school credential (CANVAS_API_TOKEN, never sent to the browser)
      → allowed Canvas action
```

Xpedition learner identity is not equivalent to a per-user Canvas identity. Every Canvas call is made as the one school credential. Xpedition never accepts a raw Canvas conversation id, user id or claim from the client:
- START returns an HMAC-signed handle bound to `{provider, conversation, learner, issuedAt}`, valid for 12 h.
- POST verifies the handle; forged, expired, re-targeted or another learner's handle all return 404.
- Canvas bodies are projected to strip user, author, course and SIS identifiers.
- Production needs `XPEDITION_INTEGRATION_SIGNING_SECRET` (≥ 32 chars, the same value on every instance). Without it, Canvas conversation actions return 503.

Per-student Canvas identity is **not** claimed and needs Canvas OAuth, which does not exist.

**Class persistence model.** The IMPORTANT QUESTION is resolved as follows. `/class` was never a protected route: guest preview of curriculum lessons predates Phase 3. Phase 4 makes the two modes explicit (`lib/classroom/classPersistence.ts`, `data-persistence` on the Class root):
- **`server_session`**: a real learner session exists (the browser `getSession` has a user). The server session is created, owner-checked and written to Postgres under RLS.
- **`guest_ephemeral`**: no learner.
  - Nothing is persisted: no server session, no integration calls, no localStorage.
  - Notes stay in memory, and the UI says "Guest: kept for this visit only (not saved)" instead of "Saved".
  - Guest data is never written under any identity.

A signed-in learner is never silently downgraded: their session request is always sent. The Phase 3 shortcut (skip the session only when auth is `unavailable`) is replaced by this rule. The stale-session and stale-scene browser test (F) now runs for a signed-in learner, because only a signed-in learner makes those requests.

## 4. Distributed state

Source of truth: `lib/security/stateInventory.ts` (tested).

| State | Classification | Production boundary |
|---|---|---|
| rate-limit buckets | requires shared store | `checkUserRateLimit` → Postgres `xp_rate_limit_hit`. The key is derived from `auth.uid()` inside a `SECURITY DEFINER` function, and the hits table is not directly accessible. It is shared across instances (verified in real PostgreSQL across separate connections). Fallback is process-local; `XPEDITION_RATE_LIMIT_REQUIRE_SHARED=1` fails closed instead |
| Canvas conversation ownership | safe (stateless) | signed handles. Needs the same signing secret on all instances |
| Class session cache | in-memory (unsafe alone) | owner-filtered, so a miss fails closed. Postgres under RLS is durable |
| visual jobs | in-memory (unsafe alone) | owner-checked, so a miss fails closed (404). A shared job store is needed before async polling across instances |
| learner visual assets | local disk (unsafe alone) | owner-checked route only. A private object store is needed for multi-instance delivery |
| cache adapter | in-memory | the old "Redis" adapter claimed a connection it never had. It now reports `distributed = false`. No security decision depends on it |

No dependency was added. The shared limiter uses the Postgres the app already requires.

## 5. Verification results

Final table: the Phase 4 section of `docs/security-backlog-p0.md`. Results from this run:

| Suite | Result | Evidence level |
|---|---|---|
| `test/phase4ProductionSecurity.test.ts` | 40/40 | unit (plus a real hanging HTTP server) |
| `test/phase4Rls.pg.test.ts` | 19/19 | real PostgreSQL 16 RLS |
| `test/phase4SupabaseLive.test.ts` | BLOCKED (missing credentials) | hosted Supabase: not run |
| Class matrix, production build without Supabase | 8 passed, 1 skipped (F runs only for a signed-in learner) | browser |
| Class matrix plus learner switching, production build with the auth stub | 13 passed, 2 skipped (F0/H apply only to the build without Supabase) | browser-stub |
| `npm test` (all legacy suites plus Phase 3/4) | green | unit |

Mutation checks: disabling the identity-change purge fails unit tests 6.1–6.3, and removing the abort makes the timeout test hang (fail).

Commands:
- `npx tsx test/phase4ProductionSecurity.test.ts`: unit/mocks (hanging-bridge test uses a real local HTTP server)
- `npx tsx test/phase4Rls.pg.test.ts`: real PostgreSQL RLS
- `npx tsx test/phase4SupabaseLive.test.ts`: hosted Supabase. **BLOCKED here: no credentials.** It prints BLOCKED and claims nothing.
- `npm run test:e2e:class`: Class matrix without Supabase (fail-closed production)
- `npm run test:e2e:auth`: Class matrix plus learner switching with two signed-in identities (stub auth)

To run the hosted verification, apply `supabase/schema.sql` to a dedicated test project, create two email/password users, and set:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `XP_TEST_USER_A_EMAIL`, `XP_TEST_USER_A_PASSWORD`
- `XP_TEST_USER_B_EMAIL`, `XP_TEST_USER_B_PASSWORD`

Then run it with `XP_REQUIRE_LIVE_SUPABASE=1`.

## 6. Remaining blockers

1. Hosted Supabase two-user verification: BLOCKED (no project or credentials). Until it passes, the system is not production-ready.
2. Strix: not run (`STRIX_LLM` and provider credentials not configured).
3. Per-student Canvas identity: does not exist (school credential only). Documented, not claimed.
4. Multi-instance visual jobs and private assets need a shared job store and a private object store.
5. World localStorage: intentionally out of scope.
6. Social tables (`guilds`, `guild_members`, `matchmaking_queue`) allow authenticated learners to read membership and queue rows by design. This needs a product decision and was not changed.
7. `feedback` accepts anonymous inserts (spam risk, no data exposure).

## 7. Hosted Supabase verification attempt (2026-09-27, commit 48e1dc4)

Result: **BLOCKED (configuration)**. Nothing was live-verified.

`npm run test:supabase:live` exited 1 with:
`BLOCKED: missing NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, XP_TEST_USER_A_EMAIL, XP_TEST_USER_A_PASSWORD, XP_TEST_USER_B_EMAIL, XP_TEST_USER_B_PASSWORD.`

- None of the six variables are set in the environment.
- No `.env*` file other than `.env.example` exists.
- No credentials were invented, and no application code was changed.

Coverage note for the next attempt. `test/phase4SupabaseLive.test.ts` checks database/RLS behaviour directly with two real users. It does not yet cover the app-level checks against hosted Supabase:
- session reload through `/api/classroom/session`;
- a visual job created through the API, and B fetching A's private image;
- browser logout/switch with real Supabase logins.

Those need the app running against the hosted project and should be added alongside the live run.
