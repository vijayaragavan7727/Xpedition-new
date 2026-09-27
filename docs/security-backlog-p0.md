# Security Backlog — P0 items confirmed in the audit (2026-09-27, updated Phase 3)

Nothing here is claimed fixed unless marked **FIXED + verified**. No Strix scan has been run
(the sandbox had no Docker daemon and no LLM provider configured). All findings come from static review
plus local tests.

| # | Finding | Status | Evidence / location |
|---|---|---|---|
| 1 | Auth fails **open** when `NEXT_PUBLIC_SUPABASE_URL` is missing | **FIXED + verified (unit + browser)** | `lib/auth/authMode.ts` → `'supabase' \| 'dev_local' \| 'unavailable'`. `dev_local` needs `NODE_ENV=development` **and** `NEXT_PUBLIC_XPEDITION_DEV_AUTH_BYPASS=1`. `evaluateServerAuth` returns 503 in `unavailable` and never produces a user; middleware redirects protected routes to `/login?error=auth_unavailable`; AuthCard / home / admin-check shortcuts are gated to `dev_local`. Tests: `test/phase3Security.test.ts` A1–A6; Playwright H (production build, no Supabase). |
| 2 | Unauthenticated `/api/classroom/integrations` | **FIXED + verified (unit + browser)** | GET and POST call `requireServerAuth` first. `handleIntegrationRequest` allow-lists learner actions (Canvas START/POST_AI_MESSAGE, Miro OPEN_WORKSPACE); everything else 403. `POST_AI_MESSAGE` requires the caller to own the Canvas conversation (fail-closed 404). Scene context is rebuilt server-side from the registry (client lesson text ignored). Body size counted on the stream (413). Generic 502 errors. Per-user rate limit preserved. Tests B1–B9. |
| 3 | Cross-learner classroom session access (IDOR) | **FIXED + verified (unit)** | Owner required at create (`SessionOwnerRequiredError`); `getSession`/`processLearnerAction` require the requester and filter by owner in memory, cache and Supabase; ownerless sessions can never be mutated. Tests E1–E2 + identity #16. **Not** verified with two real Supabase users. |
| 4 | Passport showed fabricated "cryptographic"/"verified" credentials | **FIXED + verified (unit + browser)** | `lib/passport/trustLanguage.ts` (single source of copy + claim detector), `lib/passport/evidenceModel.ts` (concept → attempts → interactions → assessment → mastery, `externallyVerified:false, signed:false`). `/passport/[id]` renders an honest unavailable page with no learner data; public-read policy on `passport_snapshots` dropped. Source scan of `app/` + `components/` fails on any unsupported claim. Tests C1–C4; Playwright H. |
| 5 | Shared-device learner state leakage | **FIXED + verified (unit)** | Global fallback key removed; persisted data only under learner-scoped keys; guests are memory-only; switching/logging out purges the previous learner; legacy global keys purged; `AuthIdentitySync` reconciles with the Supabase session. Tests D1–D3 (two-user). Not verified on a physical shared device with real Supabase accounts. |

## Related items (P1)
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
