# Xpedition — Production Foundation Architecture
## Phase B: Auth + Database + Persistent Learner State + Secure User Data

---

## 1. Chosen Authentication Architecture
Xpedition uses **Supabase Authentication** with `@supabase/ssr` (cookie-based session management across Next.js Server Components, Client Components, and Middleware) and a resilient **Local Mode Fallback**.

- **Web Browser**: Authenticates via `components/AuthCard.tsx` using email/password or OAuth providers.
- **Middleware**: Intercepts requests, validates the session cookie via `supabase.auth.getUser()`, refreshes tokens automatically, and enforces route guards on `/home`, `/quest`, `/calibrate`, `/passport`, etc.
- **Local Fallback Mode**: When Supabase credentials are not configured (e.g. offline local development, CI/CD automated test runs), Xpedition deterministically provisions isolated local sessions (`local_<sanitized_email>`) without breaking the user experience.

---

## 2. Chosen Database Architecture
Xpedition leverages **PostgreSQL via Supabase** with **Row Level Security (RLS)** as its cloud persistence layer, backed by a deterministic **Local Persistence Engine**.

- **Why Supabase/PostgreSQL?**
  1. Already integrated into the repository dependencies (`@supabase/supabase-js`, `@supabase/ssr`).
  2. Native Row Level Security (RLS) ensures hard database-level isolation between users.
  3. Scalable relational schema supporting atomic JSONB documents for rich graphs alongside structured relational rows for attempts and profiles.
  4. Generous free tier with zero upfront cost for the founder.
- **Dual-Mode Persistence Driver**:
  - `SupabasePersistenceAdapter`: Connects to Supabase tables with RLS.
  - `LocalPersistenceAdapter`: In-memory + user-scoped storage engine ensuring instantaneous testing, offline resilience, and zero cloud lock-in.

---

## 3. Database Schema Overview
The canonical database schema is defined in `supabase/schema.sql`:

1. **`profiles` / `users`**:
   - `id` (UUID, primary key)
   - `email` (TEXT, unique)
   - `display_name` (TEXT)
   - `updated_at` (TIMESTAMPTZ)
2. **`attempts`**:
   - `id` (BIGSERIAL / TEXT, primary key)
   - `user_id` (UUID, references profiles)
   - `correct` (BOOLEAN)
   - `difficulty` (INT)
   - `created_at` (TIMESTAMPTZ)
3. **`mastery`**:
   - `user_id` (UUID), `skill_id` (TEXT), `p_know` (FLOAT), `attempts` (INT), `retention_risk` (FLOAT)
4. **`game_state`**:
   - `user_id` (UUID), `xp` (INT), `level` (INT), `streak_days` (INT), `longest_streak` (INT)
5. **`xira_memories`**:
   - `id` (TEXT), `user_id` (UUID), `concept_id` (TEXT), `category` (TEXT), `strength` (FLOAT), `evidence_summary` (TEXT)

---

## 4. Persistence Flow & Data Flow
```
User Action / Experience Completion
             ↓
Existing Experiential Engine (Projectile, Molecule, Code, Universal)
             ↓
LearnerModelAdapter / AdaptiveExperienceLoop
             ↓
Deterministic BKT & DecisionEngine Calculations
             ↓
PersistenceManager (lib/persistence/persistenceAdapter.ts)
   ├── Idempotency Check (De-duplicates repeated attempt IDs)
   ├── Updates User Progression (XP, Level, Streak)
   ├── Updates Scoped User Cache (xpedition_user_<userId>)
   └── Asynchronous Cloud Sync (/api/user/state or Supabase client)
```

---

## 5. Learner Model Integration & Pedagogical Authority
- **Zero Duplicate Mastery Logic**: AI never calculates mastery, theta, or XP.
- **Authoritative Flow**: Existing `LearnerModel` (`bkt.ts`, `mastery.ts`, `decisionEngine.ts`) computes student ability ($\theta$) and assessment signals. The database serves strictly as a durable storage medium, never an algorithmic replacement.
- **Recovery Integrity**: Upon login or page reload, `persistenceManager.loadUserStore(userId)` hydrates the exact canonical state, restoring active skill graphs, calibrated theta, and attempt history.

---

## 6. Security Model
- **User Isolation & IDOR Defense**: API routes (`/api/user/state`, `/api/user/attempt`, `/api/user/memory`) strictly match authenticated session IDs against requested mutation targets.
- **Row Level Security (RLS)**: Enforces `auth.uid() = user_id` at the database engine level.
- **Client/Server Boundary**: Database service roles and provider secret keys are strictly server-side; zero secrets exist in client bundles.
- **Input Sanitization**: Xira memories and attempt hashes are bounded, type-checked, and restricted to educational categories.

---

## 7. Environment Variables
See `.env.example` for full template:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

---

## 8. Migration & Setup Steps
1. Navigate to your Supabase Project Dashboard.
2. Open the **SQL Editor**.
3. Copy the contents of `supabase/schema.sql` and run the script.
4. Verify that tables `profiles`, `attempts`, `mastery`, and `game_state` are created with RLS enabled.

---

## 9. Local Development Setup
1. Clone repository.
2. Run `npm install`.
3. To run completely offline with local persistence:
   - Run `npm run dev` (Local mode will activate automatically).
4. To test against your Supabase project:
   - Copy `.env.example` to `.env.local` and paste your Supabase URL and Anon Key.

---

## 10. Vercel Deployment Setup
1. In Vercel Project Settings, navigate to **Environment Variables**.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Set the target environments to **Production** and **Preview**.

---

## 11. Founder Manual Actions (When Ready to Deploy Cloud Database)
> [!IMPORTANT]
> No paid accounts or credit cards are required. The free Supabase tier is completely sufficient.
- **Step 1**: Visit [supabase.com](https://supabase.com) and create a free project named `Xpedition`.
- **Step 2**: Copy the **Project URL** and **anon public API Key** from Project Settings -> API.
- **Step 3**: Paste them into your `.env.local` or Vercel Environment Variables.
- **Step 4**: Run the SQL migration in `supabase/schema.sql`.

---

## 12. Future Scaling Considerations
- For high-concurrency environments (>10,000 active concurrent learners), configure PostgREST connection pooling via Supabase Supavisor (included on free tier).
- Distributed Redis caching may be layered in Phase D for cross-instance ephemeral session caching if needed.
