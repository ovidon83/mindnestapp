-- Simplified MVP Schema for GenieNotes
-- Drop existing entries table and recreate with new structure

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own entries" ON entries;
DROP POLICY IF EXISTS "Users can insert their own entries" ON entries;
DROP POLICY IF EXISTS "Users can update their own entries" ON entries;
DROP POLICY IF EXISTS "Users can delete their own entries" ON entries;

-- Drop trigger
DROP TRIGGER IF EXISTS update_entries_updated_at ON entries;

-- Drop and recreate table with new structure
DROP TABLE IF EXISTS entries CASCADE;

-- Create entries table with simplified structure
CREATE TABLE entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL DEFAULT 'thought' CHECK (entry_type IN ('thought', 'journal')),
  original_text TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('todo', 'insight', 'idea')),
  tags TEXT[] DEFAULT '{}',
  summary TEXT NOT NULL,
  next_step TEXT,
  post_recommendation BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS entries_user_id_idx ON entries(user_id);
CREATE INDEX IF NOT EXISTS entries_created_at_idx ON entries(created_at DESC);
CREATE INDEX IF NOT EXISTS entries_category_idx ON entries(category);
CREATE INDEX IF NOT EXISTS entries_entry_type_idx ON entries(entry_type);
CREATE INDEX IF NOT EXISTS entries_post_recommendation_idx ON entries(post_recommendation) WHERE post_recommendation = TRUE;

-- Enable Row Level Security
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own entries" ON entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own entries" ON entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own entries" ON entries FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own entries" ON entries FOR DELETE USING (auth.uid() = user_id);

-- Create or replace function for updated_at
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

-- Create training_data table for AI learning
CREATE TABLE IF NOT EXISTS training_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'file')),
  file_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for training_data
ALTER TABLE training_data ENABLE ROW LEVEL SECURITY;

-- Policies for training_data
CREATE POLICY "Users can view their own training data" ON training_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own training data" ON training_data FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own training data" ON training_data FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS training_data_user_id_idx ON training_data(user_id);

