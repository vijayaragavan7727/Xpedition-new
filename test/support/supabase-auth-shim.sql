-- Minimal Supabase-compatible auth surface for testing RLS in a plain PostgreSQL.
--
-- This mirrors how Supabase evaluates Row Level Security: PostgREST switches to the
-- `anon` or `authenticated` role and publishes the verified JWT claims in the
-- `request.jwt.claims` setting; `auth.uid()` / `auth.role()` read them. Only the
-- database side is reproduced here (no GoTrue, no PostgREST). It is NOT hosted
-- Supabase; it proves what the schema's policies allow and refuse.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN NOINHERIT; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN NOINHERIT; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS; END IF;
END $$;

CREATE SCHEMA IF NOT EXISTS auth;

-- Subset of Supabase's auth.users columns that the app schema's trigger reads.
CREATE TABLE IF NOT EXISTS auth.users (
  id UUID PRIMARY KEY,
  email TEXT,
  raw_user_meta_data JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION auth.jwt() RETURNS JSONB LANGUAGE sql STABLE AS $$
  SELECT COALESCE(NULLIF(current_setting('request.jwt.claims', true), ''), '{}')::JSONB
$$;

CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS $$
  SELECT NULLIF(COALESCE(current_setting('request.jwt.claim.sub', true), auth.jwt() ->> 'sub'), '')::UUID
$$;

CREATE OR REPLACE FUNCTION auth.role() RETURNS TEXT LANGUAGE sql STABLE AS $$
  SELECT NULLIF(COALESCE(current_setting('request.jwt.claim.role', true), auth.jwt() ->> 'role'), '')::TEXT
$$;

GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO anon, authenticated, service_role;

-- Supabase grants table privileges to anon/authenticated by default, so RLS is
-- the ONLY barrier. Reproduce that (worst case) before the app schema is loaded.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;
