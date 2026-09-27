# Security Backlog: P0 items confirmed in the audit (2026-09-27, updated in Phase 3 and Phase 4)

Nothing here is claimed fixed unless marked **FIXED + verified**. No Strix scan has been run
(`STRIX_LLM` and provider credentials are not configured). Hosted Supabase has **not** been exercised;
see the Phase 4 review below for the exact evidence level of each item. **The system is not production-ready.**

| # | Finding | Status | Evidence / location |
|---|---|---|---|
| 1 | Auth fails **open** when `NEXT_PUBLIC_SUPABASE_URL` is missing | **FIXED + verified (unit + browser)** | `lib/auth/authMode.ts` → `'supabase' \| 'dev_local' \| 'unavailable'`. `dev_local` needs `NODE_ENV=development` **and** `NEXT_PUBLIC_XPEDITION_DEV_AUTH_BYPASS=1`. `evaluateServerAuth` returns 503 in `unavailable` and never produces a user; middleware redirects protected routes to `/login?error=auth_unavailable`; AuthCard / home / admin-check shortcuts are gated to `dev_local`. Tests: `test/phase3Security.test.ts` A1–A6; Playwright H (production build, no Supabase). |
| 2 | Unauthenticated `/api/classroom/integrations` | **FIXED + verified (unit + browser)** | GET and POST call `requireServerAuth` first. `handleIntegrationRequest` allow-lists learner actions (Canvas START/POST_AI_MESSAGE, Miro OPEN_WORKSPACE); everything else 403. `POST_AI_MESSAGE` requires the caller to own the Canvas conversation (fail-closed 404). Scene context is rebuilt server-side from the registry (client lesson text ignored). Body size counted on the stream (413). Generic 502 errors. Per-user rate limit preserved. Tests B1–B9. |
| 3 | Cross-learner classroom session access (IDOR) | **FIXED + verified (unit)** | Owner required at create (`SessionOwnerRequiredError`); `getSession`/`processLearnerAction` require the requester and filter by owner in memory, cache and Supabase; ownerless sessions can never be mutated. Tests E1–E2 + identity #16. **Not** verified with two real Supabase users. |
| 4 | Passport showed fabricated "cryptographic"/"verified" credentials | **FIXED + verified (unit + browser)** | `lib/passport/trustLanguage.ts` (single source of copy + claim detector), `lib/passport/evidenceModel.ts` (concept → attempts → interactions → assessment → mastery, `externallyVerified:false, signed:false`). `/passport/[id]` renders an honest unavailable page with no learner data; public-read policy on `passport_snapshots` dropped. Source scan of `app/` + `components/` fails on any unsupported claim. Tests C1–C4; Playwright H. |
| 5 | Shared-device learner state leakage | **FIXED + verified (unit)** | Global fallback key removed; persisted data only under learner-scoped keys; guests are memory-only; switching/logging out purges the previous learner; legacy global keys purged; `AuthIdentitySync` reconciles with the Supabase session. Tests D1–D3 (two-user). Not verified on a physical shared device with real Supabase accounts. |

## Phase 4 security review (2026-09-27)

Evidence levels:
- **real-PG**: real PostgreSQL 16 with the real `schema.sql` plus a Supabase-compatible auth shim, run as learner A, learner B or anon (`test/phase4Rls.pg.test.ts`, 19 tests).
- **browser-stub**: a production build in Chromium against a local GoTrue/PostgREST stub, with two identities (`test/phase4LearnerSwitch.spec.ts`, and the Class matrix in both modes).
- **unit**: `test/phase4ProductionSecurity.test.ts` (40 tests; the timeout test uses a real hanging HTTP server).
- **hosted**: `test/phase4SupabaseLive.test.ts`, BLOCKED (no credentials).

| Finding | Severity | Status | Evidence |
|---|---|---|---|
| Visual jobs readable by any learner (IDOR on status/result); in-flight job sharing leaked other learners' job/request ids | P0 | **Verified fixed** (unit + browser-stub) | `getJobForOwner`, per-owner cache salt, `toClientJob`. Unit 3.1–3.4, 3.7; browser X: B gets 404 on A's status/query/asset |
| Learner-generated assets and the prompt-bearing `assets-manifest.json` publicly served from `public/` (manifest HTTP 200) | P0 | **Verified fixed** (unit + browser, both builds) | private dir outside `public/`, owner-checked `/[jobId]/asset`, middleware 404. Unit 3.3/3.5/3.6/3.8; browser: manifest 404, anon asset 401, A 200 `private, no-store` |
| Server persistence used the anon singleton: every RLS-protected write silently failed and fell back to per-instance memory | P0 | **Verified fixed (app side, browser-stub)**; hosted not verified | `getLearnerDb()` plus request-scoped client. The browser run shows every server PostgREST call carrying learner A's JWT, never anon. Unit 1.1/1.3 |
| Class sessions: cross-learner read/update/delete/takeover | P0 | **Verified with real PostgreSQL RLS** + app owner checks (unit, browser-stub X: hijack 404) | real-PG R1.1–R1.6 (including ON CONFLICT takeover and owner re-assignment rejected). **Hosted Supabase: BLOCKED** |
| Attempts, notes/memory, feedback, Passport snapshots, learner state: cross-learner read/forge | P0 | **Verified with real PostgreSQL RLS**; hosted BLOCKED | real-PG R2.1–R3.4 |
| `skills` had `USING (true)`: every learner's goal skills readable by anyone, including anon (reproduced on the Phase 3 schema) | P0 | **Verified fixed (real-PG)** | policy dropped. real-PG R3.5, R0.2 |
| `classroom_telemetry` INSERT accepted any authenticated role, so B could write rows attributed to A (reproduced on the Phase 3 schema) | P1 | **Verified fixed (real-PG)** | real-PG R4.2 |
| OpenMAIC (and Canvas) calls had no server-side timeout | P0 | **Verified fixed (unit, real hanging server)** | 250–20000 ms bounded deadline covering headers and body. Default 2500 ms for OpenMAIC (under the 3000 ms Class deadline); deterministic 504; Class falls back; no unhandled rejections. Unit 5.1–5.5 |
| Canvas: raw conversation ids trusted; process-memory ownership (lost across instances); raw Canvas bodies (user/course ids) returned | P1 | **Verified fixed (unit)** | HMAC learner-bound handles, allow-list, projected bodies, 503 without a signing secret in production. Unit 4.1–4.5. Limitation documented: *Xpedition learner identity is not equivalent to a per-user Canvas identity.* |
| Rate limits per instance only (multi-instance bypass) | P1 | **Verified fixed (real-PG + unit)**; hosted BLOCKED | `xp_rate_limit_hit` (SECURITY DEFINER, keyed by `auth.uid()`, shared across connections). real-PG R5.1–R5.2; unit 8.3–8.4 |
| "Redis" cache adapter claimed a connection it never had | P1 | **Fixed** (unit 8.2) | now `distributed = false`; no security decision depends on it |
| Shared device: sign-out not seen by the tab, or a direct identity change, left the previous learner's local data | P1 | **Verified fixed (unit + browser-stub at 5 viewports)** | purge all other learners on any identity change and on logout. Unit 6.1–6.3; browser L ×5 |
| Guest Class notes showed "Saved" while nothing was persisted | P1 | **Fixed** (unit 6.4) | guest label "kept for this visit only (not saved)" |
| Guest Class issued session/integration requests that could only fail | P2 | **Verified fixed (browser F0, unit 5.4)** | explicit `guest_ephemeral` persistence mode |
| Auth fail-closed regression (Phase 3) | P0 | **Verified (unit 7.x, browser H on a production build without Supabase)** | – |
| Unused `SUPABASE_SERVICE_ROLE_KEY` read into config | P2 | **Fixed** | removed; unit 1.2 asserts no service-role key anywhere |
| Hosted Supabase two-user verification | P0 gate | **Blocked by missing environment** | no project or test users in this environment |
| Strix scan | – | **Blocked by missing environment** | `STRIX_LLM` not configured |
| Per-student Canvas identity | P1 | **Intentionally deferred** | needs Canvas OAuth |
| Multi-instance visual jobs and private assets (shared job store, private object store) | P1 | **Deferred** (fails closed today: 404) | `lib/security/stateInventory.ts` |
| World localStorage | – | **Intentionally deferred** (out of scope) | – |
| Social tables readable by authenticated learners (`guilds`, `guild_members`, `matchmaking_queue`) | P2 | **Deferred** (product decision) | – |

## Related items (P1), historical (pre-Phase 4)
- Visual-generation job lookup has no owner check: `app/api/visual-generation/[jobId]/route.ts`, `route.ts` GET.
- The rate limiter is in-memory (per serverless instance), and 17 of 20 API routes have no limiter.
  In local browser runs the session limiter returned 429 under automated load (about 60 page loads
  per minute). That is expected behaviour, and it is recorded in `test/artifacts/.../rate-limited.json`.
- `ClassroomSessionStore` uses the browser (anon) Supabase client on the server, so session DB
  persistence is ineffective under RLS. Sessions currently live in per-instance memory.
- The OpenMAIC bridge fetch has no server-side timeout.

## Recommended fixes (next phase)
1. `requireServerAuth`: allow the mock user only when `NODE_ENV === 'development'` **and** an explicit
   `XPEDITION_LOCAL_AUTH_BYPASS=1` is set. Otherwise return 503. Add a test for the production env.
2. Integrations POST: require auth, return generic error bodies, stream-count the body size, validate
   `scene.payload` against the visual identity contract on the server, and add a bridge timeout.
3. Passport: either back `/passport/[id]` with a published, RLS-checked snapshot, or label it clearly
   as a demo. Remove "cryptographic" and "verified" wording until a signing mechanism exists.
4. `lib/store.ts`: drop the global key and read and write only `xpedition_user_<id>`. Clear the guest
   state on login.
5. Owner checks on visual-generation jobs, a shared (Redis/Upstash) rate limiter, and a server-side
   Supabase client for session persistence.
