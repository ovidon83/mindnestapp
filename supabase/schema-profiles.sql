-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Personal info
  name TEXT,
  role TEXT,
  industry TEXT,
  location TEXT,
  
  -- Interests & domains
  interests TEXT[] DEFAULT '{}',
  domains TEXT[] DEFAULT '{}',
  
  -- Goals & priorities
  goals TEXT[] DEFAULT '{}',
  priorities TEXT,
  
  -- Communication & style preferences
  communication_style TEXT CHECK (communication_style IN ('concise', 'detailed', 'balanced')),
  preferred_tone TEXT CHECK (preferred_tone IN ('professional', 'casual', 'friendly', 'analytical')),
  
  -- Work & productivity
  work_style TEXT CHECK (work_style IN ('structured', 'flexible', 'hybrid')),
  time_management TEXT CHECK (time_management IN ('morning', 'afternoon', 'evening', 'flexible')),
  
  -- Context for AI
  context TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS user_profiles_user_id_idx ON user_profiles(user_id);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own profile
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own profile
CREATE POLICY "Users can delete their own profile"
  ON user_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

