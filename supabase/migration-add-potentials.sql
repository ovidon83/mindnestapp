-- Migration: Add Potential system to thoughts table
-- This replaces the old Action system with a simpler Potential system

-- Add potential columns
ALTER TABLE thoughts ADD COLUMN IF NOT EXISTS potential TEXT CHECK (potential IN ('Share', 'To-Do', 'Insight', 'Just a thought')) DEFAULT NULL;
ALTER TABLE thoughts ADD COLUMN IF NOT EXISTS best_potential TEXT CHECK (best_potential IN ('Share', 'To-Do', 'Insight', 'Just a thought')) DEFAULT NULL;

-- Add potential-specific data columns (JSONB for flexibility)
ALTER TABLE thoughts ADD COLUMN IF NOT EXISTS share_posts JSONB DEFAULT NULL;
ALTER TABLE thoughts ADD COLUMN IF NOT EXISTS todo_data JSONB DEFAULT NULL;
ALTER TABLE thoughts ADD COLUMN IF NOT EXISTS insight_data JSONB DEFAULT NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS thoughts_potential_idx ON thoughts(potential) WHERE potential IS NOT NULL;
CREATE INDEX IF NOT EXISTS thoughts_best_potential_idx ON thoughts(best_potential) WHERE best_potential IS NOT NULL;

-- Migrate existing data: Convert old best_action/selected_action to new potential system
-- Note: Conversation becomes Insight
UPDATE thoughts 
SET 
  potential = CASE 
    WHEN selected_action = 'Share' THEN 'Share'
    WHEN selected_action = 'To-Do' THEN 'To-Do'
    WHEN selected_action = 'Conversation' THEN 'Insight'
    ELSE NULL
  END,
  best_potential = CASE
    WHEN best_action = 'Share' THEN 'Share'
    WHEN best_action = 'To-Do' THEN 'To-Do'
    WHEN best_action = 'Conversation' THEN 'Insight'
    ELSE NULL
  END
WHERE (selected_action IS NOT NULL OR best_action IS NOT NULL) 
  AND potential IS NULL;

