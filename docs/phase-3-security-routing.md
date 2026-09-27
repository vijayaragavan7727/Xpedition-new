# Phase 3 — Security + Routing Consolidation

Scope: P0.1–P0.5 security fixes and P1 registry consolidation for /learn, /tutor and /quest.
No Class visual changes. World is untouched. No Strix scan was run (no configured environment).
This is **not** a production-readiness claim; see "Remaining" below.

## P0 fixes

| Item | Change | Key files |
|---|---|---|
| P0.1 Production auth fails closed | Auth mode is `supabase`, `dev_local` (only `NODE_ENV=development` + `NEXT_PUBLIC_XPEDITION_DEV_AUTH_BYPASS=1`) or `unavailable`. `unavailable` → APIs 503, protected pages redirect to `/login?error=auth_unavailable`, no local sign-in UI. | `lib/auth/authMode.ts`, `lib/auth/serverAuth.ts`, `lib/auth/routeProtection.ts`, `middleware.ts`, `components/AuthCard.tsx`, `app/page.tsx`, `app/login/page.tsx`, `app/api/admin/check/route.ts` |
| P0.2 Integrations | Auth first (GET + POST), per-user rate limit, streamed body limit (16 KB), learner action allow-list, Canvas conversation ownership, server-rebuilt scene context, generic errors, provider details hidden from GET. | `lib/classroom/integrations/integrationAuthorization.ts`, `lib/security/requestBody.ts`, `app/api/classroom/integrations/route.ts`, `classroomIntegrationRuntime.ts` |
| P0.3 Passport trust | Honest "Learning Record" copy + disclaimer, evidence trail, no share link, public route shows nothing, schema public-read dropped, claim detector + source scan. | `lib/passport/*`, `app/(app)/passport/page.tsx`, `app/passport/[id]/page.tsx`, `components/PassportShareModal.tsx`, `app/(app)/progress/page.tsx`, `supabase/schema.sql` |
| P0.4 Shared device | No global key; learner-scoped storage; guest memory-only; purge on switch/logout; legacy key purge; auth/session reconciliation. | `lib/security/learnerStorage.ts`, `lib/store.ts`, `components/auth/AuthIdentitySync.tsx`, notes/feedback/quest consumers |
| P0.5 Session authorization | Owner required to create; every read/mutation checks requester === owner (memory, cache, Supabase filter). The Class does not request a session when auth is unavailable. | `lib/classroom/XiraClassroomOrchestrator.ts`, `lib/classroom/ClassroomSessionStore.ts`, `app/api/classroom/session/route.ts`, `components/classroom/ClassroomLayout.tsx` |

## P1 registry consolidation

`lib/concepts/routeConceptResolution.ts` is the adapter used by /learn, /tutor, /quest, /api/lesson and
/api/user/attempt: canonical registry → learner's own goal-graph node (exact id) → explicit `quick` topic →
`unavailable`. No goal-text or default-concept fallback; /quest never serves the whole pool for an unknown
target. `lib/experience/topicResolver.ts` is registry-first with whole-token matching only. Experience-only
concepts (`spatial_reasoning`, `python_debugging_basics`) are registered with `hasClassLesson: false`.

Kept impossible (tested): `industrial_revolution → evolution`, `research_methods → binary_search`,
`unknown → dc_motor`.

## Verification

- `npm run typecheck` ✓ · `npm run lint` ✓ (24 pre-existing warnings, 0 errors) · `npm run build` ✓ (Google Fonts mocked in the sandbox)
- `npm test` ✓ — includes `test/phase3Security.test.ts` (30 tests, sections A–F) and `test/conceptIdentity.test.ts` (23)
- Playwright Class matrix (`npm run test:e2e:class`) against `next start` with no Supabase: 8/8, including new test H
  (fail-closed redirects, 503 APIs, honest public Passport, registry-gated /learn and /tutor).

## Remaining (not fixed in Phase 3)

> Phase 4 update: most items below are addressed. See `docs/phase-4-production-security.md` and the Phase 4 review in `docs/security-backlog-p0.md`.

- Canvas uses one school server token; per-learner Canvas OAuth does not exist. Ownership is enforced in Xpedition only.
- Rate limiter and the Canvas ownership store fall back to per-instance memory without a shared cache.
- `ClassroomSessionStore` uses the anon Supabase client on the server; DB persistence under RLS is unverified.
- Visual-generation job GET is authenticated but has no job-owner check.
- OpenMAIC bridge fetch has no server-side timeout.
- World/economy localStorage was not migrated (World is out of scope).
- No test with two real Supabase accounts; no Strix scan; builds in the sandbox used a font mock.
