# 📋 XPEDITION — PHASE F PRODUCTION LAUNCH CHECKLIST

This checklist provides an authoritative, evidence-based verification of Xpedition's production readiness prior to public beta launch.

---

## 1. AUTOMATED / VERIFIED (Engineering Complete)

The following systems, guarantees, and boundaries have been implemented, audited, and verified via automated test suites and live build verification:

- [x] **0 Security Leaks / Shell Execution**: No instances of `eval()`, `Function()`, `child_process`, `exec()`, `spawn()`, or `dangerouslySetInnerHTML` in application code.
- [x] **Client-Side Secret Shielding**: Zero server-only secrets exposed in client bundles. Verified that all API keys (`GROQ_API_KEY`, `TAVILY_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `FREELLMAPI_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) are accessed strictly within Node.js runtime API routes.
- [x] **Deterministic Intelligence Authority**: AI is strictly advisory and enrichment-only. Zero AI authority over Bayesian Knowledge Tracing (BKT), learner state, mastery progression, or quest routing.
- [x] **Multi-Provider Fallback & Resilience**: `FallbackRouter` circuit breaker tested. Visited-provider tracking prevents infinite loops; timeout, rate-limit, and auth failures degrade smoothly to deterministic Xira pedagogical advice.
- [x] **Resilient Persistence with Fallback**: Supabase authentication and session validation via `@supabase/ssr`. Local persistence fallback guarantees continuity if cloud connections fail.
- [x] **Session Identity Isolation**: User ownership strictly verified via authenticated Supabase server sessions (`supabase.auth.getUser()`). Zero trust given to query parameter `userId`, request body `userId`, or client localStorage.
- [x] **API Input Bounds & Protection**: `/api/chat`, `/api/execute`, `/api/user/state`, `/api/user/attempt`, `/api/user/memory`, `/api/user/export`, and `/api/user/delete` validate input shapes, bound maximum string lengths, and return sanitized, learner-facing error messages without stack traces.
- [x] **WebGL Memory Disposal**: Three.js disposal utility (`disposeThreeScene`) recursively unloads geometries, textures, materials, clears scene graphs, forces WebGL context loss, and unmounts canvas elements to prevent memory leaks across sessions.
- [x] **Legal & Trust Suite**: Centralized legal configuration in `lib/legal/legalConfig.ts` powering `/privacy`, `/terms`, `/ai-transparency`, `/disclaimer`, `/sources`, and `/trust`. User data export (`/api/user/export`) and user deletion (`/api/user/delete`) endpoints are live.
- [x] **Responsive Mobile Layouts**: Clean responsive design tested across 320px to desktop viewports with navigation bars, dialog containers, and adaptive views.
- [x] **World Engine Preservation**: World implementation (`app/world` and `components/world/`) remains strictly frozen and unmodified.

---

## 2. FOUNDER ACTION REQUIRED (External Accounts & Real Infrastructure)

These actions require real external founder accounts, credentials, and business decisions. They cannot and should not be automated by code:

1. **Production Supabase Project**:
   - [ ] Create a production project in the Supabase Dashboard.
   - [ ] Execute `supabase/schema.sql` in the Supabase SQL Editor to create tables (`profiles`, `mastery`, `attempts`, `game_state`, `xira_memories`, `learner_state_backups`) with Row Level Security (RLS).
   - [ ] Copy the Project URL and Anon Key into the production hosting environment (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
   - [ ] Store the Service Role Key in `SUPABASE_SERVICE_ROLE_KEY` (server-side only, for admin cleanup).

2. **Production AI Provider Credentials**:
   - [ ] Set `GROQ_API_KEY` (primary fast inference).
   - [ ] (Optional) Set `TAVILY_API_KEY` (web grounding/sources).
   - [ ] (Optional) Set `OPENAI_API_KEY` or `GEMINI_API_KEY` as tertiary fallback providers.
   - [ ] (Optional) Set `FREELLMAPI_KEY` / `FREELLMAPI_ENDPOINT` if utilizing internal gateway.

3. **Domain & DNS Configuration**:
   - [ ] Point custom domain (e.g., `app.xpeditionedu.com`) to the hosting provider (e.g., Vercel / AWS / Cloudflare).
   - [ ] Set `NEXT_PUBLIC_APP_URL` to the authoritative production HTTPS domain.
   - [ ] In the Supabase Dashboard under Authentication -> URL Configuration:
     - Set Site URL to `https://app.xpeditionedu.com`
     - Add redirect URL: `https://app.xpeditionedu.com/auth/callback`

4. **Legal Entity & Compliance Finalization**:
   - [ ] Update `LEGAL_CONFIG.legalEntityPlaceholder` in `lib/legal/legalConfig.ts` with the officially incorporated company name, registration number, and registered address.
   - [ ] Confirm the official support inbox is active at `support@xpeditionedu.com`.
   - [ ] Formalize age threshold policy and COPPA/GDPR Parental Consent mechanism if onboarding users under 13.

---

## 3. OPTIONAL BEFORE BETA

- [ ] Configure Sentry or Datadog for production client and server error tracking.
- [ ] Configure PostHog or privacy-first telemetry (e.g. Plausible) for anonymous aggregate product usage analytics.
- [ ] Setup transactional email provider (Resend or SendGrid) for welcome and recovery emails via Supabase Auth custom SMTP.

---

## 4. POST-BETA (Roadmap / Scaling)

- [ ] Automated read-replica / edge caching for skill graph definitions.
- [ ] Native mobile wrapper packaging (Capacitor or React Native shell).
- [ ] Institution/Teacher classroom dashboard with multi-tenant RBAC.
