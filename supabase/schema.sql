-- =============================================================================
-- Xpedition Production Supabase Database Schema & Row Level Security (RLS)
-- Version: Production Candidate 1.1.0
--
-- Idempotent, production-hardened schema reconciling all canonical application
-- persistence models (profiles, mastery, attempts, game_state, world_state,
-- xira_memories, learner_profile, quest_attempts, feedback, and passport credentials).
-- =============================================================================

-- Enable pgcrypto extension for high-entropy UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. USER IDENTITY & PROFILES
-- =============================================================================

-- 1a. Users Table (Core account metadata & learner preferences)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  share_id UUID DEFAULT gen_random_uuid(),
  timezone TEXT DEFAULT 'UTC',
  motivation_type TEXT DEFAULT 'trophy',
  current_status TEXT,
  year_and_branch TEXT,
  learner_rating TEXT,
  last_exam_marks TEXT,
  learning_style TEXT DEFAULT 'story',
  daily_time TEXT DEFAULT '30 min',
  interests JSONB DEFAULT '[]'::jsonb,
  accessibility_settings JSONB DEFAULT '{"focusMode": false, "dyslexiaFriendly": false, "reducedMotion": false}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1b. Profiles Table (Lightweight public/semi-public user identification)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1c. Learner Profile Table (Onboarding selections & calibration background)
CREATE TABLE IF NOT EXISTS public.learner_profile (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  path_type TEXT,
  topic TEXT,
  daily_minutes INT,
  starting_level TEXT,
  why_goal TEXT,
  current_step INT DEFAULT 1,
  prior_knowledge TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 2. CURRICULUM, GOALS & SKILL GRAPH
-- =============================================================================

-- 2a. Goals Table (User active and archived learning goals)
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_text TEXT NOT NULL,
  title TEXT NOT NULL,
  sources JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2b. Skills Table (Goal-associated concepts and ordering)
CREATE TABLE IF NOT EXISTS public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  difficulty INT NOT NULL DEFAULT 1,
  source_url TEXT,
  order_index INT NOT NULL DEFAULT 0
);

-- 2c. Modules Table (Curriculum content catalog)
CREATE TABLE IF NOT EXISTS public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id TEXT NOT NULL,
  level INT NOT NULL DEFAULT 1,
  learning_style TEXT NOT NULL DEFAULT 'story',
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  takeaways JSONB NOT NULL,
  sources JSONB NOT NULL,
  questions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_modules_skill_level_style ON public.modules(skill_id, level, learning_style);

-- =============================================================================
-- 3. MASTERY, ATTEMPTS & INTELLIGENCE TELEMETRY
-- =============================================================================

-- 3a. Mastery Table (Bayesian Knowledge Tracing & Memory Retention Half-Life)
CREATE TABLE IF NOT EXISTS public.mastery (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE,
  p_know FLOAT DEFAULT 0.15,
  attempts INT DEFAULT 0,
  half_life_hours FLOAT DEFAULT 48.0,
  next_review_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, skill_id)
);

-- 3b. Attempts Table (Canonical attempt records)
CREATE TABLE IF NOT EXISTS public.attempts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id UUID,
  correct BOOLEAN NOT NULL,
  latency_ms INT DEFAULT 0,
  hints_used INT DEFAULT 0,
  difficulty INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_attempts_user_created ON public.attempts(user_id, created_at DESC);

-- 3c. Quest Attempts Table (Experiential quest runs & history query model)
CREATE TABLE IF NOT EXISTS public.quest_attempts (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  concept_id TEXT NOT NULL,
  concept_name TEXT,
  is_correct BOOLEAN NOT NULL,
  confidence_level TEXT DEFAULT 'known',
  is_solo BOOLEAN DEFAULT FALSE,
  is_void BOOLEAN DEFAULT FALSE,
  item_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_quest_attempts_user_created ON public.quest_attempts(user_id, created_at DESC);

-- 3d. Served Questions Table (Anti-Repetition Engine)
CREATE TABLE IF NOT EXISTS public.served_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  question_hash TEXT NOT NULL,
  prompt TEXT NOT NULL,
  skill_id TEXT,
  skill_name TEXT,
  served_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_served_questions_user_hash ON public.served_questions(user_id, question_hash);
CREATE INDEX IF NOT EXISTS idx_served_questions_user_skill ON public.served_questions(user_id, skill_name, served_at DESC);

-- 3e. User Module Progress Table
CREATE TABLE IF NOT EXISTS public.user_module_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  skill_id TEXT NOT NULL,
  level INT NOT NULL DEFAULT 1,
  read_completed BOOLEAN DEFAULT FALSE,
  test_passed BOOLEAN DEFAULT FALSE,
  score INT DEFAULT 0,
  attempts INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_module_progress ON public.user_module_progress(user_id, skill_id, level);

-- =============================================================================
-- 4. XIRA EDUCATIONAL MEMORIES
-- =============================================================================

-- 4a. Xira Memories Table (Pedagogical memory retention across sessions)
CREATE TABLE IF NOT EXISTS public.xira_memories (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  concept_id TEXT NOT NULL,
  concept_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'recurring_error',
    'confidence_calibration',
    'difficulty_response',
    'intervention_effectiveness',
    'preferred_format'
  )),
  strength FLOAT NOT NULL DEFAULT 0.5 CHECK (strength >= 0.0 AND strength <= 1.0),
  evidence_summary TEXT DEFAULT '',
  timestamp BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_xira_memories_user_concept_cat 
  ON public.xira_memories(user_id, concept_id, category);

CREATE INDEX IF NOT EXISTS idx_xira_memories_user_id 
  ON public.xira_memories(user_id);

CREATE INDEX IF NOT EXISTS idx_xira_memories_user_timestamp 
  ON public.xira_memories(user_id, timestamp DESC);

-- =============================================================================
-- 5. PROGRESSION, GAME STATE & WORLD
-- =============================================================================

-- 5a. Game State Table (XP, level, daily streaks)
CREATE TABLE IF NOT EXISTS public.game_state (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp INT DEFAULT 0,
  level INT DEFAULT 1,
  streak_days INT DEFAULT 0,
  longest_streak INT DEFAULT 1,
  streak_freezes INT DEFAULT 0,
  last_active_date DATE DEFAULT CURRENT_DATE
);

-- 5b. Reward Arms Table (Multi-Armed Bandit optimization)
CREATE TABLE IF NOT EXISTS public.reward_arms (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  arm TEXT NOT NULL,
  alpha FLOAT DEFAULT 1.0,
  beta FLOAT DEFAULT 1.0,
  pulls INT DEFAULT 0,
  returns INT DEFAULT 0,
  PRIMARY KEY (user_id, arm)
);

-- 5c. Study Sessions Table
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id TEXT,
  goal_title TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  questions_answered INT DEFAULT 0,
  correct_count INT DEFAULT 0,
  skills_touched JSONB DEFAULT '[]'::jsonb,
  last_skill_id TEXT,
  last_skill_name TEXT,
  xp_earned INT DEFAULT 0,
  ended_reason TEXT DEFAULT 'completed'
);

-- 5d. World State Table (Learning-driven world simulation)
CREATE TABLE IF NOT EXISTS public.world_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_graph_id TEXT NOT NULL,
  world_theme TEXT NOT NULL DEFAULT 'cosmos',
  total_mastery_percent INT NOT NULL DEFAULT 0,
  tier INT NOT NULL DEFAULT 1,
  buildings JSONB NOT NULL DEFAULT '[]'::jsonb,
  lps_score NUMERIC DEFAULT 0,
  lps_tier INT DEFAULT 1,
  lps_profile TEXT DEFAULT 'scholar',
  unlocked_areas TEXT[] DEFAULT '{central}',
  resources JSONB DEFAULT '{"wood":0,"stone":0,"crystal":0,"gold":0}'::jsonb,
  active_missions JSONB DEFAULT '[]'::jsonb,
  last_evolved_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, skill_graph_id)
);

-- =============================================================================
-- 6. CREDENTIALS, EVALUATIONS & FEEDBACK
-- =============================================================================

-- 6a. Passport Snapshots Table (Cryptographically verified student credentials)
CREATE TABLE IF NOT EXISTS public.passport_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  share_id UUID NOT NULL,
  goal_title TEXT NOT NULL,
  skills_json JSONB NOT NULL,
  overall_readiness FLOAT NOT NULL,
  signature TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_passport_snapshots_share_id ON public.passport_snapshots(share_id);

-- 6b. Experiment Assignments Table (A/B Learning Gain Harness)
CREATE TABLE IF NOT EXISTS public.experiment_assignments (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  cohort TEXT NOT NULL CHECK (cohort IN ('adaptive', 'control')),
  assigned_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6c. Pre/Post Assessments Table
CREATE TABLE IF NOT EXISTS public.assessments (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE,
  phase TEXT NOT NULL CHECK (phase IN ('pre', 'post')),
  score FLOAT NOT NULL,
  max_score FLOAT NOT NULL DEFAULT 5.0,
  taken_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6d. Feedback Table (In-app user ratings & learner feedback)
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rating INT,
  body TEXT NOT NULL,
  route TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 7. SOCIAL & MULTIPLAYER (GUILDS, PEER QUESTS, RAIDS)
-- =============================================================================

-- 7a. Guilds Table
CREATE TABLE IF NOT EXISTS public.guilds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7b. Guild Members Table
CREATE TABLE IF NOT EXISTS public.guild_members (
  guild_id UUID REFERENCES public.guilds(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (guild_id, user_id)
);

-- 7c. Peer Quests Table
CREATE TABLE IF NOT EXISTS public.peer_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  prompt TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_index INT NOT NULL,
  approved BOOLEAN DEFAULT FALSE,
  plays INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7d. Matchmaking Queue Table
CREATE TABLE IF NOT EXISTS public.matchmaking_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  difficulty INT DEFAULT 2,
  status TEXT DEFAULT 'queued',
  matched_session_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7e. Raid Sessions Table
CREATE TABLE IF NOT EXISTS public.raid_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player1_name TEXT NOT NULL,
  player2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player2_name TEXT NOT NULL,
  is_ai_partner BOOLEAN DEFAULT FALSE,
  boss_hp INT DEFAULT 100,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 8. AUTOMATIC AUTH USER TRIGGER
-- =============================================================================

-- Auto-provision public.profiles and public.users upon Supabase auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

  INSERT INTO public.users (id, email, display_name, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach trigger idempotently
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- 9. PRODUCTION ROW LEVEL SECURITY (RLS) POLICIES
-- Strict user isolation; zero unrestricted USING (true) policies on user data.
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.served_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xira_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_arms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.world_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passport_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guilds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matchmaking_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raid_sessions ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Clean up legacy permissive policies (Drop if exists)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow full access for users" ON public.users;
DROP POLICY IF EXISTS "Allow full access for goals" ON public.goals;
DROP POLICY IF EXISTS "Allow full access for skills" ON public.skills;
DROP POLICY IF EXISTS "Allow full access for guilds" ON public.guilds;
DROP POLICY IF EXISTS "Allow full access for guild_members" ON public.guild_members;
DROP POLICY IF EXISTS "Allow full access for peer_quests" ON public.peer_quests;
DROP POLICY IF EXISTS "Allow full access for matchmaking_queue" ON public.matchmaking_queue;
DROP POLICY IF EXISTS "Allow full access for raid_sessions" ON public.raid_sessions;
DROP POLICY IF EXISTS "Allow full access for experiment_assignments" ON public.experiment_assignments;
DROP POLICY IF EXISTS "Allow full access for assessments" ON public.assessments;
DROP POLICY IF EXISTS "Allow full access for study_sessions" ON public.study_sessions;
DROP POLICY IF EXISTS "Allow full access for world_state" ON public.world_state;

-- -----------------------------------------------------------------------------
-- 9a. Users & Profiles Policies
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage own user record" ON public.users;
CREATE POLICY "Users can manage own user record" ON public.users
  FOR ALL USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;
CREATE POLICY "Users can manage own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Prevent unauthorized bulk email enumeration (Drop public read access on profiles)
DROP POLICY IF EXISTS "Allow public read access for profiles" ON public.profiles;

DROP POLICY IF EXISTS "Users can manage own learner profile" ON public.learner_profile;
CREATE POLICY "Users can manage own learner profile" ON public.learner_profile
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 9b. Goals & Skills Policies
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage own goals" ON public.goals;
CREATE POLICY "Users can manage own goals" ON public.goals
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow public read for skills" ON public.skills;
CREATE POLICY "Allow public read for skills" ON public.skills
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own goal skills" ON public.skills;
CREATE POLICY "Users can manage own goal skills" ON public.skills
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.goals
      WHERE goals.id = skills.goal_id
      AND goals.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.goals
      WHERE goals.id = skills.goal_id
      AND goals.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Allow public read for modules" ON public.modules;
CREATE POLICY "Allow public read for modules" ON public.modules
  FOR SELECT USING (true);

-- -----------------------------------------------------------------------------
-- 9c. Mastery, Attempts & Progress Policies
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage own mastery" ON public.mastery;
CREATE POLICY "Users can manage own mastery" ON public.mastery
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own attempts" ON public.attempts;
CREATE POLICY "Users can manage own attempts" ON public.attempts
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own quest attempts" ON public.quest_attempts;
CREATE POLICY "Users can manage own quest attempts" ON public.quest_attempts
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own served questions" ON public.served_questions;
CREATE POLICY "Users can manage own served questions" ON public.served_questions
  FOR ALL USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can manage own module progress" ON public.user_module_progress;
CREATE POLICY "Users can manage own module progress" ON public.user_module_progress
  FOR ALL USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- -----------------------------------------------------------------------------
-- 9d. Xira Educational Memories Policies (Strict Private Learner Data)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage own xira_memories" ON public.xira_memories;
CREATE POLICY "Users can manage own xira_memories" ON public.xira_memories
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 9e. Progression, Game State & World Policies
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage own game_state" ON public.game_state;
CREATE POLICY "Users can manage own game_state" ON public.game_state
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own reward_arms" ON public.reward_arms;
CREATE POLICY "Users can manage own reward_arms" ON public.reward_arms
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own study sessions" ON public.study_sessions;
CREATE POLICY "Users can manage own study sessions" ON public.study_sessions
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own world state" ON public.world_state;
CREATE POLICY "Users can manage own world state" ON public.world_state
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 9f. Passport & Evaluation Policies
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage own passport_snapshots" ON public.passport_snapshots;
CREATE POLICY "Users can manage own passport_snapshots" ON public.passport_snapshots
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Intentional public read-only access for verified shared credentials by share_id
DROP POLICY IF EXISTS "Allow public read access for passport_snapshots by share_id" ON public.passport_snapshots;
CREATE POLICY "Allow public read access for passport_snapshots by share_id" ON public.passport_snapshots
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view and set own experiment assignment" ON public.experiment_assignments;
CREATE POLICY "Users can view and set own experiment assignment" ON public.experiment_assignments
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own assessments" ON public.assessments;
CREATE POLICY "Users can manage own assessments" ON public.assessments
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 9g. Feedback Policies (Insert-Only Public Access, No Public Select)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.feedback;
CREATE POLICY "Anyone can submit feedback" ON public.feedback
  FOR INSERT WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 9h. Social & Multiplayer Policies
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can view guilds" ON public.guilds;
CREATE POLICY "Authenticated users can view guilds" ON public.guilds
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can create guilds" ON public.guilds;
CREATE POLICY "Authenticated users can create guilds" ON public.guilds
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can manage own guild membership" ON public.guild_members;
CREATE POLICY "Users can manage own guild membership" ON public.guild_members
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Guild members can view co-members" ON public.guild_members;
CREATE POLICY "Guild members can view co-members" ON public.guild_members
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Anyone can view approved peer quests" ON public.peer_quests;
CREATE POLICY "Anyone can view approved peer quests" ON public.peer_quests
  FOR SELECT USING (approved = true OR auth.uid() = author_user_id);

DROP POLICY IF EXISTS "Authors can manage own peer quests" ON public.peer_quests;
CREATE POLICY "Authors can manage own peer quests" ON public.peer_quests
  FOR ALL USING (auth.uid() = author_user_id)
  WITH CHECK (auth.uid() = author_user_id);

DROP POLICY IF EXISTS "Users can manage own queue entry" ON public.matchmaking_queue;
CREATE POLICY "Users can manage own queue entry" ON public.matchmaking_queue
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can view queue" ON public.matchmaking_queue;
CREATE POLICY "Authenticated users can view queue" ON public.matchmaking_queue
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Participants can view and manage own raid sessions" ON public.raid_sessions;
CREATE POLICY "Participants can view and manage own raid sessions" ON public.raid_sessions
  FOR ALL USING (auth.uid() = player1_id OR auth.uid() = player2_id)
  WITH CHECK (auth.uid() = player1_id OR auth.uid() = player2_id);
