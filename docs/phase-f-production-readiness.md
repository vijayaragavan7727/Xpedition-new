# Phase F — Production Configuration & Readiness Audit
**Date:** September 17, 2026  
**Auditor:** Automated Production Readiness Suite  
**Product:** Xpedition  
**Target:** Production & Beta-Launch Readiness

---

## 1. Executive Summary

This document establishes the authoritative production environment inventory for Xpedition. It audits all environment variables, public versus private boundaries, third-party AI provider secrets, Supabase persistence credentials, callback URLs, and failover mechanics.

### Core Security Guarantees
1. **Zero Client Secret Exposure:** Only variables prefixed with `NEXT_PUBLIC_` are bundled into the browser client. In Xpedition, this is strictly limited to `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, which are public client identifiers protected by Supabase Row Level Security (RLS).
2. **Server-Side AI Secrets:** `GROQ_API_KEY`, `TAVILY_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `SARVAM_API_KEY`, and `FREE_LLM_API_KEY` are consumed exclusively in server-side Node.js API routes. None are prefixed with `NEXT_PUBLIC_`.
3. **Resilient Local Offline Fallback:** If cloud environment variables are omitted or network errors occur, the platform defaults to an offline-resilient local persistence and deterministic intelligence mode, ensuring uninterrupted operation during local development or staging tests.

---

## 2. Environment Variables Inventory

| Variable Name | Scope | Sensitivity | Required in Prod? | Description & Fallback Behavior |
| :--- | :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Client & Server | Public | **Yes (Cloud)** | Public URL of Supabase project (`https://<ref>.supabase.co`). If blank, platform engages Local Mode. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client & Server | Public (RLS protected) | **Yes (Cloud)** | Anon JWT token for client-side authentication and session management. |
| `GROQ_API_KEY` | Server Only | **Secret** | Recommended | Low-latency inference key for Xira tutoring explanations and misconception diagnosis. Deterministic fallback engaged if missing. |
| `TAVILY_API_KEY` | Server Only | **Secret** | Recommended | Real-time factual search retrieval key for academic research grounding. Cached OER fallback engaged if missing. |
| `OPENAI_API_KEY` | Server Only | **Secret** | Optional | Fallback LLM provider for complex reasoning tasks. |
| `GEMINI_API_KEY` | Server Only | **Secret** | Optional | Secondary qualitative analysis provider. |
| `SARVAM_API_KEY` | Server Only | **Secret** | Optional | Indian language translation and TTS provider. |
| `FREE_LLM_API_URL` / `FREELLMAPI_URL` | Server Only | Internal/Config | Optional | Multi-model proxy gateway URL. Default: `http://localhost:4000/v1`. |
| `FREE_LLM_API_KEY` / `FREELLMAPI_API_KEY` | Server Only | **Secret** | Optional | Gateway API authentication token. |
| `PAID_AI_ENABLED` | Server Only | Config | Optional | Master kill-switch (`true`/`false`). Default `false` guarantees zero billable API invocations. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server Only | **CRITICAL SECRET** | Optional | Admin key for Supabase Auth user purge. **Must NEVER be exposed with NEXT_PUBLIC_ prefix.** |

---

## 3. Client / Server Boundary Audit

### A. Client-Side Bundle Inspection
- Static analysis of webpack/Next.js client bundle confirmed **zero** occurrences of private provider keys in browser runtime.
- The `AuthCard.tsx` startup validation checks `NEXT_PUBLIC_SUPABASE_URL` format and warns users if set to dashboard URLs rather than the project API URL.
- All intelligence calls route through Next.js API endpoints (`/api/chat`, `/api/execute`, `/api/user/*`).

### B. Production Redirects & Callback URLs
- **Auth Callback:** `/auth/callback` handles OAuth PKCE code exchange with Supabase.
- **Signout Callback:** `/auth/signout` invalidates session and clears cookies.
- **Production Domain Requirement:** When deploying to Vercel/production, the founder must add `https://<production-domain>/auth/callback` to the *Redirect URLs* list in Supabase Dashboard -> Authentication -> URL Configuration.

---

## 4. Local Development vs. Production Guidelines

### Local Development Setup (`.env.local`)
```env
# Optional: Leave blank to use 100% offline Local Mode
NEXT_PUBLIC_SUPABASE_URL=https://<dev-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<dev-anon-key>

# Optional AI providers (deterministic fallbacks active if missing)
GROQ_API_KEY=gsk_...
TAVILY_API_KEY=tvly-...
PAID_AI_ENABLED=false
```

### Production Environment Setup (Vercel / Cloud Host)
1. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to Production Environment Variables.
2. Add `GROQ_API_KEY` and `TAVILY_API_KEY` as Server-Only Production Secrets.
3. Ensure `PAID_AI_ENABLED` is set according to subscription budget policy.
4. Set `SUPABASE_SERVICE_ROLE_KEY` in server environment if automatic backend user account deletion is required.

---

## 5. Audit Conclusion

The environment configuration adheres to modern security and zero-trust standards:
- All sensitive API credentials are strictly server-side.
- Zero secrets are embedded into Git source control.
- Public client keys are limited to Supabase anon keys protected by database Row Level Security.
- The platform functions deterministically and safely even in the complete absence of external API keys.
