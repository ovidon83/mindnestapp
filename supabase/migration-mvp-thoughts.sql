-- MVP Migration: Create thoughts and actions tables
-- This migration creates the new MVP structure while keeping entries table for backward compatibility

-- Create thoughts table
CREATE TABLE IF NOT EXISTS thoughts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_text TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  summary TEXT NOT NULL,
  is_spark BOOLEAN DEFAULT FALSE,
  potentials JSONB DEFAULT '[]', -- Array of potential objects (max 2-3)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create actions table
CREATE TABLE IF NOT EXISTS actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  thought_id UUID NOT NULL REFERENCES thoughts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('post', 'email', 'conversation', 'exploration', 'article', 'project')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS thoughts_user_id_idx ON thoughts(user_id);
CREATE INDEX IF NOT EXISTS thoughts_created_at_idx ON thoughts(created_at DESC);
CREATE INDEX IF NOT EXISTS thoughts_is_spark_idx ON thoughts(is_spark) WHERE is_spark = TRUE;
CREATE INDEX IF NOT EXISTS actions_user_id_idx ON actions(user_id);
CREATE INDEX IF NOT EXISTS actions_thought_id_idx ON actions(thought_id);
CREATE INDEX IF NOT EXISTS actions_created_at_idx ON actions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE thoughts ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;

-- Policies for thoughts
CREATE POLICY "Users can view their own thoughts" ON thoughts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own thoughts" ON thoughts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own thoughts" ON thoughts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own thoughts" ON thoughts FOR DELETE USING (auth.uid() = user_id);

-- Policies for actions
CREATE POLICY "Users can view their own actions" ON actions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own actions" ON actions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own actions" ON actions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own actions" ON actions FOR DELETE USING (auth.uid() = user_id);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_thoughts_updated_at BEFORE UPDATE ON thoughts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_actions_updated_at BEFORE UPDATE ON actions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

