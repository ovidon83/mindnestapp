-- Add is_parked column to thoughts table
ALTER TABLE thoughts ADD COLUMN IF NOT EXISTS is_parked BOOLEAN DEFAULT FALSE;

-- Create index for parked thoughts
CREATE INDEX IF NOT EXISTS thoughts_is_parked_idx ON thoughts(is_parked) WHERE is_parked = TRUE;

