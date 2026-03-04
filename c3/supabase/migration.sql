-- C3 Supabase Schema Migration
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard

CREATE TABLE IF NOT EXISTS c3_agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT,
  role TEXT,
  division TEXT,
  anime TEXT,
  model TEXT,
  power TEXT,
  status TEXT DEFAULT 'online',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS c3_tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  agent TEXT,
  priority TEXT DEFAULT 'P1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS c3_comms (
  id TEXT PRIMARY KEY,
  agent TEXT,
  role TEXT,
  division TEXT,
  time TEXT,
  body TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS c3_targets (
  id TEXT PRIMARY KEY,
  label TEXT,
  current_val INTEGER DEFAULT 0,
  goal INTEGER DEFAULT 0,
  color TEXT,
  unit TEXT,
  format TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS c3_models (
  id TEXT PRIMARY KEY,
  name TEXT,
  provider TEXT,
  api_key TEXT,
  base_url TEXT,
  status TEXT DEFAULT 'active',
  context TEXT,
  reasoning BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS c3_workspaces (
  agent_id TEXT PRIMARY KEY,
  soul TEXT,
  identity TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS c3_standups (
  id TEXT PRIMARY KEY,
  title TEXT,
  date TEXT,
  participants TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS c3_standup_messages (
  id SERIAL PRIMARY KEY,
  standup_id TEXT REFERENCES c3_standups(id) ON DELETE CASCADE,
  agent TEXT,
  role TEXT,
  body TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS c3_config (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS + anon access policies
ALTER TABLE c3_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE c3_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE c3_comms ENABLE ROW LEVEL SECURITY;
ALTER TABLE c3_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE c3_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE c3_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE c3_standups ENABLE ROW LEVEL SECURITY;
ALTER TABLE c3_standup_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE c3_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all" ON c3_agents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON c3_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON c3_comms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON c3_targets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON c3_models FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON c3_workspaces FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON c3_standups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON c3_standup_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON c3_config FOR ALL USING (true) WITH CHECK (true);
