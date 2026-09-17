# Phase E — Security & Privacy Architecture Audit
**Date:** September 17, 2026  
**Auditor:** Automated Core Security Audit Suite & Static Analysis  
**Repository:** Xpedition Learning Systems  
**Status:** AUDIT COMPLETED — REMEDIATION APPLIED

---

## 1. Executive Summary

As part of Phase E (Legal + Trust + Privacy + Source Attribution Hardening), an exhaustive security audit of the Xpedition codebase was conducted. The audit covered authentication boundaries, client-side secret exposure, remote code execution risks (`eval`, `Function`, `child_process`, `exec`), Insecure Direct Object References (IDOR), Server-Side Request Forgery (SSRF), prompt injection vectors, and data deletion isolation.

One remediation was identified and implemented:
- **Remediation Applied:** An obsolete client-side `eval()` fallback in `components/TutorBoard.tsx` (previously executed when Pyodide WebAssembly was not yet initialized) was completely removed and replaced with a safe status notification.

All other evaluated attack vectors and boundaries demonstrated robust defenses and strict isolation.

---

## 2. Secrets & Credential Exposure Audit

| Inspection Target | Findings | Risk Status |
| :--- | :--- | :--- |
| **`NEXT_PUBLIC_*` Variables** | Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are exposed to the client bundle. These are intended for browser authentication under Supabase Row Level Security. | **SECURE** |
| **AI Provider Keys** | `GROQ_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `TAVILY_API_KEY`, and `FREE_LLM_API_KEY` are strictly accessed via server-side Node.js `process.env` within API routes. None carry the `NEXT_PUBLIC_` prefix. | **SECURE** |
| **Database Credentials** | Database connection strings, service role keys, and administration tokens are absent from client bundles. | **SECURE** |
| **Hardcoded Secrets** | No hardcoded API keys, bearer tokens, or database passwords exist in repository source code. | **SECURE** |

---

## 3. Code Execution & Runtime Injection Audit

| Inspection Pattern | Findings | Remediation |
| :--- | :--- | :--- |
| **`eval()`** | Found one instance in `components/TutorBoard.tsx` (line 102) as a fallback if Pyodide was uninitialized. | **FIXED:** Removed `eval()` entirely. Replaced with safe user notification. Zero `eval()` in production code. |
| **`Function()` / `new Function()`** | Zero occurrences in entire repository. | **SECURE** |
| **`child_process` / `exec` / `spawn`** | Zero occurrences in production runtime or API routes. Occurrences are strictly confined to Node.js CLI test runner scripts (`test/run*.js`). | **SECURE** |
| **`dangerouslySetInnerHTML`** | Zero occurrences in any React component or page in the application. | **SECURE** |

---

## 4. Insecure Direct Object Reference (IDOR) & User Isolation Audit

All user endpoints were audited to verify whether arbitrary `userId` parameters in request bodies or query strings could be used to manipulate or access other users' data:

1. **`GET /api/user/state`**: Authoritatively checks `@supabase/ssr` server session (`supabase.auth.getUser()`). Returns 401 if unauthenticated.
2. **`POST /api/user/state`**: Verifies authenticated session identity. Explicitly compares `payloadData.userId` with `authenticatedUserId`; returns `403 Forbidden` if a mismatch is detected, preventing cross-user writes.
3. **`GET /api/user/export`**: Retrieves canonical state exclusively for the authenticated user ID extracted from the server session. Completely ignores query/body overrides.
4. **`POST /api/user/delete`**: Requires explicit confirmation string `DELETE_MY_ACCOUNT_AND_DATA` and deletes only data mapped to the session-authenticated user ID.
5. **`POST /api/user/attempt`**: Extracts user ID from authenticated session, falling back to guest mode; ignores client attempt to masquerade as another user.
6. **`GET/POST /api/user/memory`**: Scoped strictly to authenticated user session.

---

## 5. Server-Side Request Forgery (SSRF) Audit

The source retrieval system (`lib/intelligence/sources/`) handles fetching of external learning references. Protections were verified:

1. **Pre-flight URL Validation (`SourceDiscovery.isSafeUrl`)**:
   - Rejects non-HTTP/HTTPS schemes (e.g. `file:`, `ftp:`, `gopher:`, `data:`).
   - Rejects localhost, `127.0.0.1`, `::1`, `0.0.0.0`, `.local`, and `.localhost`.
   - Rejects cloud metadata IP endpoints (AWS/GCP `169.254.169.254`, `metadata.google.internal`, Alibaba `100.100.100.200`).
   - Rejects decimal and hex IP representations (e.g., `2130706433`).
   - Rejects private IPv4 ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`).
2. **Post-Redirect Verification**:
   - `SourceRetrieval.fetchExternalSource` validates the `finalUrl` after redirects to prevent redirect bypasses.
3. **Resource Capping**:
   - Size limit: 512 KB max payload.
   - Timeout: 5000 ms hard abort.

---

## 6. Prompt Injection Defense Audit

External and untrusted text ingested into LLM prompts (e.g., external textbook excerpts or student questions) is protected by:
- **Sanitization (`SourceRetrieval.sanitizeExternalText`)**:
  - Strips HTML `<script>`, `<iframe>`, and `<system>` tags.
  - Neutralizes role-spoofing directives (`Assistant:`, `System:`, `Human:`, `User:`).
  - Filters instruction-overriding phrases (`ignore previous instructions`, `system override`).
- **Strict Security Delimiters (`wrapUntrustedContent`)**:
  - Wraps content in `<untrusted_source_content>` with clear system boundary instructions preventing execution as instructions.

---

## 7. AI Authority Boundaries

- **Pedagogical Advice Only:** AI generates explanations, hints, and analogies.
- **Deterministic Assessment Invariant:** Generative AI does **not** evaluate mastery or manipulate Bayesian Knowledge Tracing parameters directly. All mastery probabilities are updated via the deterministic BKT mathematical model (`lib/intelligence/assessment.ts`).
- **Deterministic Routing Invariant:** Next action recommendations are resolved deterministically based on mastery thresholds and prerequisites (`lib/intelligence/decisionEngine.ts`).

---

## 8. Audit Conclusion

The Xpedition codebase demonstrates high security hygiene with strict user isolation, server-side secret confinement, rigorous SSRF prevention, zero raw HTML injection, and deterministic mastery evaluation. Following the elimination of the legacy `eval()` in `TutorBoard.tsx`, no critical security vulnerabilities remain in the tested scope.
