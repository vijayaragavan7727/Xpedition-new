# Production Supabase Configuration Checklist — Xpedition
**Phase F Operational Hardening Document**  
**Audience:** Founders & DevOps Engineers  
**Status:** Pre-Launch Setup & Verification Guide

---

## 1. Overview & Architecture

Xpedition supports a hybrid persistence model:
1. **Cloud Production Persistence:** Backed by PostgreSQL and Supabase Auth with strict Row Level Security (RLS) policies scoped to `auth.uid()`.
2. **Local Resilient Fallback:** If cloud credentials are not supplied, or during network latency or offline learning, the platform seamlessly operates using `LocalPersistenceAdapter` (`localStorage` + in-memory store) without throwing blocking errors.

---

## 2. Row Level Security (RLS) & User Isolation

All user-owned tables enforce RLS:

| Table Name | Primary Key | Scoped Ownership Column | RLS Policy Rule | Allowed Operations |
| :--- | :--- | :--- | :--- | :--- |
| **`public.profiles`** | `id` (UUID) | `id` | `auth.uid() = id` | SELECT, INSERT, UPDATE, DELETE own profile; public select for display names |
| **`public.xira_memories`** | `id` (TEXT) | `user_id` | `auth.uid() = user_id` | Strict user-only SELECT, INSERT, UPDATE, DELETE own pedagogical memories |
| **`public.learner_profile`** | `user_id` (UUID) | `user_id` | `auth.uid() = user_id` | SELECT, INSERT, UPDATE, DELETE own onboarding/calibration profile |
| **`public.attempts`** | `id` (BIGSERIAL) | `user_id` | `auth.uid() = user_id` | SELECT, INSERT, DELETE own attempt history |
| **`public.quest_attempts`** | `id` (TEXT) | `user_id` | `auth.uid() = user_id` | SELECT, INSERT, DELETE own experiential quest records |
| **`public.mastery`** | `(user_id, skill_id)` | `user_id` | `auth.uid() = user_id` | SELECT, INSERT, UPDATE, DELETE own BKT data |
| **`public.game_state`** | `user_id` (UUID) | `user_id` | `auth.uid() = user_id` | SELECT, INSERT, UPDATE, DELETE own progression |
| **`public.world_state`** | `id` (UUID) | `user_id` | `auth.uid() = user_id` | SELECT, INSERT, UPDATE, DELETE own world progression |
| **`public.passport_snapshots`**| `id` (UUID) | `user_id` | `auth.uid() = user_id` (public read on `share_id`) | Users manage own; public can view shared passport link |

> [!IMPORTANT]
> **Zero Trust for Client-Supplied User IDs:**  
> Next.js API endpoints (`/api/user/state`, `/api/user/attempt`, `/api/user/memory`, `/api/user/export`, `/api/user/delete`) verify the user session authoritatively via `supabase.auth.getUser()`. Query parameters, request body overrides, or local storage values for `userId` are completely ignored for authorization, strictly eliminating Insecure Direct Object References (IDOR).

---

## 3. Step-by-Step Founder Setup Checklist

Follow these exact steps when creating the live production database:

### Step 1: Create Supabase Project
1. Log in to [Supabase Console](https://supabase.com/dashboard).
2. Click **New Project** and specify:
   - **Name:** `xpedition-production`
   - **Region:** Closest to target students (e.g., `us-east-1` or `ap-south-1`).
   - **Database Password:** Generate a secure high-entropy password and store in your password manager.

### Step 2: Apply Database Migration Schema
1. In your Supabase Dashboard, navigate to **SQL Editor**.
2. Open or copy the entire contents of [`supabase/schema.sql`](file:///c:/Users/VIJAYA%20RAGAVAN/Desktop/Xpedition%20new/supabase/schema.sql).
3. Paste into the SQL query runner and click **Run**.
4. Confirm that all tables (`profiles`, `attempts`, `mastery`, `game_state`, `world_state`, `passport_snapshots`) are created with Row Level Security enabled.

### Step 3: Configure Authentication & Redirect URLs
1. In the Supabase Dashboard, navigate to **Authentication** -> **URL Configuration**.
2. Set **Site URL** to your production domain:  
   `https://xpeditionedu.com` (or your chosen production domain).
3. Under **Redirect URLs**, add:
   - `https://xpeditionedu.com/auth/callback`
   - `https://xpeditionedu.com/auth/signout`
   - `http://localhost:3000/auth/callback` (for local staging tests)
4. Under **Email Templates**, customize confirmation email templates if email verification is desired.

### Step 4: Add Production Secrets to Vercel / Hosting Provider
Navigate to your hosting provider settings (e.g. Vercel Project Settings -> Environment Variables) and set:

```env
# Public Client Keys (Safe for browser bundle under RLS)
NEXT_PUBLIC_SUPABASE_URL=https://<production-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<production-anon-key>

# Optional Server-Only Admin Key (Required only for server-side user deletion of auth.users)
SUPABASE_SERVICE_ROLE_KEY=<production-service-role-key>
```

---

## 4. Verification & Testing

After configuring the production Supabase environment:
1. Register a new test account via `/login?mode=signup`.
2. Inspect the Supabase Dashboard -> Table Editor -> `profiles` to confirm the row was created with the user's UUID.
3. Complete an interactive quest (e.g., Projectile Motion or Newton's Laws) and verify that the `attempts` table records the trial.
4. Export the data via the Profile page and confirm the JSON payload accurately reflects the recorded attempts.
5. Trigger account deletion via the Profile page modal and verify that the user's records in `profiles` and `attempts` are purged.
