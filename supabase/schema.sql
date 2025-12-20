-- Create entries table
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

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS entries_user_id_idx ON entries(user_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS entries_created_at_idx ON entries(created_at DESC);

-- Create index on time_bucket for filtering
CREATE INDEX IF NOT EXISTS entries_time_bucket_idx ON entries(time_bucket);

-- Create index on type for filtering
CREATE INDEX IF NOT EXISTS entries_type_idx ON entries(type);

-- Enable Row Level Security
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own entries
CREATE POLICY "Users can view their own entries"
  ON entries FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own entries
CREATE POLICY "Users can insert their own entries"
  ON entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own entries
CREATE POLICY "Users can update their own entries"
  ON entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own entries
CREATE POLICY "Users can delete their own entries"
  ON entries FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_entries_updated_at
  BEFORE UPDATE ON entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

