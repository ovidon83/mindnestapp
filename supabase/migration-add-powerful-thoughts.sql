-- Add is_powerful and powerful_score columns to thoughts table
-- These fields support the "What Matters" feature that highlights important thoughts

-- Add is_powerful column (manual flag for "What Matters")
ALTER TABLE thoughts ADD COLUMN IF NOT EXISTS is_powerful BOOLEAN DEFAULT FALSE;

-- Add powerful_score column (AI-calculated score 0-100)
ALTER TABLE thoughts ADD COLUMN IF NOT EXISTS powerful_score INTEGER DEFAULT NULL;

-- Create index for powerful thoughts (for filtering "What Matters" section)
CREATE INDEX IF NOT EXISTS thoughts_is_powerful_idx ON thoughts(is_powerful) WHERE is_powerful = TRUE;

-- Create index for powerful_score (for sorting by importance)
CREATE INDEX IF NOT EXISTS thoughts_powerful_score_idx ON thoughts(powerful_score DESC) WHERE powerful_score IS NOT NULL;

