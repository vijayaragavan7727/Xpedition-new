# Xpedition — Legal & Data Inventory

**Document Version:** 1.0.0  
**Last Updated:** September 17, 2026  
**Status:** AUDITED FROM ACTIVE REPOSITORY CODE

This inventory documents all categories of data handled, processed, or persisted within the Xpedition repository. Every entry reflects active code paths, storage adapters, and external boundaries.

---

## 1. Data Category Matrix

| Data Category | Purpose & Why It Exists | Storage Location | Required? | Retention Behavior | Third-Party Disclosure | Used for Personalization? | Used for AI Training? | Deletion Mechanism |
|---|---|---|---|---|---|---|---|---|
| **Account & Profile** | Authenticates user, establishes identity, displays username/handle | Supabase Auth (`auth.users`), Supabase DB (`public.profiles`), `localStorage` fallback | Yes (for authenticated journeys; optional for guest `/teach`) | Retained until user deletes account or resets profile | No third parties (managed via Supabase Auth) | Yes (display name, target learning goal, difficulty preference) | No | Deletable via `/api/user/delete` and Profile page reset |
| **Learner Mastery & BKT** | Tracks cognitive mastery probability per concept using Bayesian Knowledge Tracing ($L, T, G, S$) | Supabase DB (`public.profiles.mastery` / state JSON), `localStorage` (`xpedition_user_state_*`) | Yes (core educational engine) | Retained across sessions for spaced repetition and mastery tracking | None (100% computed server/client side deterministically) | Yes (drives question difficulty, concept selection, decay warnings) | No | Deletable via `/api/user/delete` and Profile data reset |
| **Question Attempts & Trials** | Records responses, correctness, response latency, confidence ratings, and trial parameters | Supabase DB (`public.attempts`), `localStorage` | Yes (evidence for BKT and skill progression) | Append-only historical log with attempt deduplication | None (processed internally by Decision Engine) | Yes (determines pass/fail, misconceptions, and confidence reinforcement) | No | Deletable via `/api/user/delete` and store clear |
| **Game State & Progression** | Tracks XP points, student level, daily streaks, unlocked world buildings, coins, and badges | Supabase DB (`public.profiles`), `localStorage` | Yes (for gamified motivation loop) | Persistent across sessions | None | Yes (unlocks subsequent quest stages and world zones) | No | Deletable via `/api/user/delete` and store clear |
| **Xira Educational Memories** | Stores structured pedagogical observations (e.g., recurring calculation errors, format preferences) | Supabase DB (`public.profiles` state blob), `localStorage` (`xpedition_user_state_*`) | No (advisory companion memory) | Up to 50 most salient pedagogical memories per user | None (evaluated strictly within isolated user context) | Yes (tailors Xira conversational hints and reminders) | No | Deletable via `/api/user/delete` and store clear |
| **Granular Telemetry** | Emits high-frequency interaction signals (slider moves, stage switches, camera rotates, hint clicks) | In-memory `TelemetryEmitter`, aggregated into session records | Optional (ephemeral during active session) | In-memory during active experience session; aggregated summary persisted to attempts | None | Yes (session calibration and hint recommendations) | No | Cleared on unmount / session termination |
| **Uploaded Learner Documents** | Provides user-supplied lecture notes or textbook PDFs for grounded question answering | Ephemeral in-memory lexical chunking (`lib/intelligence/documents.ts`) | Optional (only if user uploads a note/PDF) | Session-scoped; lexical chunks indexed in memory during query | Sent only to active configured LLM provider for grounded QA prompt | Yes (answers questions strictly from user-provided notes) | No | Cleared on document switch or session end |
| **AI Generated Content** | Explanations, analogies, contextual hints, and writing evaluations produced by AI | Ephemeral response payload; cached in memory if repeated | Optional (system gracefully falls back to deterministic curriculum) | Ephemeral in-memory | Generated via Groq, Tavily, OpenAI, or Gemini based on configured routing | Yes (enriches explanations for the active concept) | No (vendor zero-data-retention APIs requested where available) | Not stored permanently |
| **Educational Source References** | Authoritative citations from OER publishers (OpenStax, MIT OCW, PhET, NASA) | Static codebase registry (`lib/intelligence/sources/sourceRegistry.ts`), Knowledge Bundle cache | No user data involved | Codebase static asset | Public open links; no user PII transmitted | No (public curriculum grounding) | No | N/A (platform curriculum data) |
| **Technical & Session Cookies** | Manages Supabase authentication token cookies (`sb-*-auth-token`), active user id | Browser HTTP-only cookies, `sessionStorage`, `localStorage` | Yes (essential for authentication and state sync) | Cleared on logout or browser cache purge | None | No (strictly functional authentication) | No | Cleared immediately on logout |

---

## 2. Storage Boundaries & Isolation

1. **Client-Side Storage**:
   - `localStorage`: Scoped strictly by user key (`xpedition_user_state_${userId}`). No cross-user key access.
   - `sessionStorage`: Scoped to active browser session (`xpedition_active_user_id`).
2. **Server-Side Persistence**:
   - Supabase tables: `profiles` and `attempts` with Row Level Security (RLS) policies based on `auth.uid()`.
   - APIs strictly validate authenticated session identity; request bodies cannot spoof arbitrary `userId`.
3. **Third-Party AI Boundaries**:
   - API keys for external providers (`GROQ_API_KEY`, `TAVILY_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`) reside exclusively in server-side environment variables. Zero client-side exposure.
   - FreeLLMAPI is an optional server-side fallback gateway with strict timeout boundaries and zero intelligence authority.
4. **Source Retrieval Isolation**:
   - Outbound HTTP requests for source discovery enforce SSRF filters blocking private IP ranges (`127.0.0.1`, `10.0.0.0/8`, `192.168.0.0/16`, AWS metadata endpoints).
