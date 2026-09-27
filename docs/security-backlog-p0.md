# Security Backlog — P0 items confirmed in the audit (2026-09-27)

Nothing here is claimed fixed unless marked **FIXED + verified**. No Strix scan has been run
(the sandbox had no Docker daemon and no LLM provider configured). All findings come from static review
plus local tests.

| # | Finding | Status | Evidence / location |
|---|---|---|---|
| 1 | Auth fails **open** when `NEXT_PUBLIC_SUPABASE_URL` is missing | **OPEN** | `lib/auth/serverAuth.ts:18` returns a mock authenticated user when Supabase is unconfigured, regardless of `NODE_ENV`. |
| 2 | Unauthenticated `/api/classroom/integrations` POST | **OPEN (mitigated)** | No `requireServerAuth`. Can trigger Canvas `POST_AI_MESSAGE` with the server token. Returns raw `error.message`. Size check trusts `content-length`. Mitigation in Phase 2: the Class only calls it when OpenMAIC reports `configured`, and OpenMAIC now reports `unavailable` when unset. |
| 3 | Cross-learner classroom session access (IDOR) | **FIXED + verified (unit)** | Sessions store `ownerId` from the authenticated user. `processLearnerAction` rejects other requesters with `SessionNotFoundError` → 404. Session ids are `sess_<uuid>` (not guessable). Unknown concepts get 404 `CONCEPT_UNAVAILABLE`, and concept/session mismatches get 409. Verified by `test/conceptIdentity.test.ts` #16. **Not** verified with two real Supabase users. |
| 4 | Public Passport shows fabricated "cryptographic" credentials | **OPEN** | `app/passport/[id]/page.tsx` renders hardcoded skills and 70 % mastery for any id, titled "Verified Skill Passport / CRYPTOGRAPHIC CREDENTIAL". `components/PassportShareModal.tsx:187` says "Cryptographic Solo Verification System". No signing exists. |
| 5 | Shared-device learner state leakage | **PARTIAL** | FIXED: Class notes key is now `xpedition_notes_<userId|guest>_<conceptId>`. OPEN: `lib/store.ts` `getStoreData()` falls back to the unscoped global key, and `saveStoreData()` always writes it. |

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
