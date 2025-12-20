-- Migration: Add Mindbox fields to entries table
-- Adds: ai_hint, badge_override, posting_score, in_share_it

ALTER TABLE entries 
ADD COLUMN IF NOT EXISTS ai_hint TEXT;

ALTER TABLE entries 
ADD COLUMN IF NOT EXISTS badge_override TEXT CHECK (badge_override IN ('todo', 'insight', 'journal'));

ALTER TABLE entries 
ADD COLUMN IF NOT EXISTS posting_score INTEGER CHECK (posting_score >= 0 AND posting_score <= 100);

ALTER TABLE entries 
ADD COLUMN IF NOT EXISTS in_share_it BOOLEAN DEFAULT FALSE;

-- Add index for Share it queries
CREATE INDEX IF NOT EXISTS entries_in_share_it_idx ON entries(in_share_it) WHERE in_share_it = TRUE;

-- Add comments
COMMENT ON COLUMN entries.ai_hint IS 'Single AI hint line (e.g., "Possible next step: ...", "Might be worth sharing.")';
COMMENT ON COLUMN entries.badge_override IS 'User override for badge type (todo, insight, journal)';
COMMENT ON COLUMN entries.posting_score IS 'Internal posting potential score (0-100, hidden from UI)';
COMMENT ON COLUMN entries.in_share_it IS 'Whether this entry is in Share it';

