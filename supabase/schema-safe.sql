-- Safe schema creation that handles existing objects
-- This script can be run multiple times safely

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own entries" ON entries;
DROP POLICY IF EXISTS "Users can insert their own entries" ON entries;
DROP POLICY IF EXISTS "Users can update their own entries" ON entries;
DROP POLICY IF EXISTS "Users can delete their own entries" ON entries;

-- Drop trigger if exists (only for entries table)
DROP TRIGGER IF EXISTS update_entries_updated_at ON entries;

-- Note: We don't drop the function because it might be used by other tables
-- Instead, we use CREATE OR REPLACE FUNCTION below

-- Create entries table (IF NOT EXISTS handles existing table)
CREATE TABLE IF NOT EXISTS entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('task', 'thought')),
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_at TIMESTAMPTZ,
  time_bucket TEXT NOT NULL CHECK (time_bucket IN ('overdue', 'today', 'tomorrow', 'this_week', 'next_week', 'later', 'someday', 'none')),
  priority TEXT CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
  pinned BOOLEAN DEFAULT FALSE,
  completed BOOLEAN DEFAULT FALSE,
  ai_confidence NUMERIC,
  note TEXT,
  sub_tasks JSONB DEFAULT '[]',
  progress INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes (IF NOT EXISTS handles existing indexes)
CREATE INDEX IF NOT EXISTS entries_user_id_idx ON entries(user_id);
CREATE INDEX IF NOT EXISTS entries_created_at_idx ON entries(created_at DESC);
CREATE INDEX IF NOT EXISTS entries_time_bucket_idx ON entries(time_bucket);
CREATE INDEX IF NOT EXISTS entries_type_idx ON entries(type);

-- Enable Row Level Security
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- Create policies (now safe since we dropped existing ones)
CREATE POLICY "Users can view their own entries"
  ON entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own entries"
  ON entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own entries"
  ON entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own entries"
  ON entries FOR DELETE
  USING (auth.uid() = user_id);

-- Create or replace function to update updated_at timestamp
-- Using OR REPLACE so it works even if function exists (used by other tables)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_entries_updated_at
  BEFORE UPDATE ON entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

