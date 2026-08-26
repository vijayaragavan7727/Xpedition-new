-- =============================================================================
-- XPEDITION DATABASE SCHEMA & ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. PROFILES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    handle TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- 2. LEARNER PROFILE TABLE (Tutor Intake & Preferences)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.learner_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    path_type TEXT CHECK (path_type IN ('goal', 'syllabus')),
    topic TEXT NOT NULL,
    language TEXT CHECK (language IN ('english', 'tanglish', 'tamil')),
    daily_minutes INT CHECK (daily_minutes IN (15, 30, 60, 120)),
    starting_level TEXT,
    why_goal TEXT,
    deadline_date DATE,
    test_date DATE,
    syllabus_text TEXT,
    syllabus_file_path TEXT,
    learning_mode TEXT CHECK (learning_mode IN ('tutor', 'quest')),
    current_step INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.learner_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own learner profile" ON public.learner_profile
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own learner profile" ON public.learner_profile
    FOR ALL USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 3. ATTEMPTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attempts (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    concept_id TEXT NOT NULL,
    concept_name TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    confidence TEXT CHECK (confidence IN ('known', 'unsure')),
    is_solo BOOLEAN DEFAULT FALSE,
    is_void BOOLEAN DEFAULT FALSE,
    chosen_index INT,
    chosen_text TEXT,
    correct_index INT,
    item_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attempts" ON public.attempts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attempts" ON public.attempts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 4. CONCEPTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.concepts (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    mastery_percentage INT DEFAULT 0,
    items_next INT DEFAULT 3,
    retention_risk NUMERIC DEFAULT 0.0,
    pts_since_calibration INT DEFAULT 0,
    theta_assisted NUMERIC DEFAULT -0.4,
    theta_solo NUMERIC DEFAULT NULL,
    solo_attempts_count INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.concepts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own concepts" ON public.concepts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own concepts" ON public.concepts
    FOR ALL USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 5. FEEDBACK TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    body TEXT NOT NULL,
    route TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Anyone (authenticated or anonymous local user) can submit feedback
CREATE POLICY "Anyone can insert feedback" ON public.feedback
    FOR INSERT WITH CHECK (true);

-- Only admin service role can select feedback
CREATE POLICY "Service role can select feedback" ON public.feedback
    FOR SELECT USING (auth.role() = 'service_role');

-- -----------------------------------------------------------------------------
-- 6. GOAL RATE LIMITS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.goal_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ip_address TEXT,
    day DATE DEFAULT CURRENT_DATE NOT NULL,
    count INT DEFAULT 1 NOT NULL,
    CONSTRAINT unique_user_day UNIQUE(user_id, day),
    CONSTRAINT unique_ip_day UNIQUE(ip_address, day)
);

ALTER TABLE public.goal_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can manage goal rate limits" ON public.goal_rate_limits
    FOR ALL USING (true);

-- -----------------------------------------------------------------------------
-- 7. AI CACHE TABLE (Shared Prompt & Response Cache)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_cache (
    cache_key TEXT PRIMARY KEY,
    response JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    hit_count INT DEFAULT 1 NOT NULL
);

ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;

-- Anyone (authenticated or anonymous) can read and insert into shared AI cache
CREATE POLICY "Anyone can read ai cache" ON public.ai_cache
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert ai cache" ON public.ai_cache
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update ai cache hit count" ON public.ai_cache
    FOR UPDATE USING (true);

-- -----------------------------------------------------------------------------
-- 8. SUPABASE STORAGE BUCKET: syllabus_files
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('syllabus_files', 'syllabus_files', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload syllabus files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'syllabus_files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can read syllabus files"
ON storage.objects FOR SELECT
USING (bucket_id = 'syllabus_files');

-- -----------------------------------------------------------------------------
-- 9. SUPABASE STORAGE BUCKET: tutor-audio (Sarvam TTS Cache)
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('tutor-audio', 'tutor-audio', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Tutor audio is publicly readable" ON storage.objects
    FOR SELECT USING (bucket_id = 'tutor-audio');

-- -----------------------------------------------------------------------------
-- 10. DISTRACTOR STATS TABLE (Aggregate Item Quality & Misconceptions - No User IDs)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.distractor_stats (
    item_hash TEXT NOT NULL,
    chosen_index INT NOT NULL,
    chosen_text TEXT,
    prompt TEXT,
    times_chosen INT DEFAULT 1,
    times_this_was_correct INT DEFAULT 0,
    first_seen TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (item_hash, chosen_index)
);

ALTER TABLE public.distractor_stats ENABLE ROW LEVEL SECURITY;

-- Learners CANNOT read distractor_stats (Admin only)
CREATE POLICY "Admin only select on distractor_stats" ON public.distractor_stats
    FOR SELECT USING ((SELECT handle FROM public.profiles WHERE id = auth.uid()) = 'admin' OR auth.jwt() ->> 'email' LIKE '%admin%');

CREATE POLICY "Authenticated users can insert/upsert distractor_stats" ON public.distractor_stats
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload tutor audio" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'tutor-audio');
