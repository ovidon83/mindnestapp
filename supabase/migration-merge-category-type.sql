-- Migration: Merge category and entry_type into single 'type' field
-- This migration adds new fields while keeping old ones for backward compatibility
-- Run this to add the new structure, old fields remain for easy rollback

-- Add new 'type' column (merged category + entry_type)
ALTER TABLE entries 
ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('todo', 'insight', 'journal'));

-- Add 'completed' field for todos
ALTER TABLE entries 
ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE;

-- Create index for new type field
CREATE INDEX IF NOT EXISTS entries_type_idx ON entries(type);

-- Create index for completed field
CREATE INDEX IF NOT EXISTS entries_completed_idx ON entries(completed) WHERE completed = FALSE;

-- Add comments
COMMENT ON COLUMN entries.type IS 'Merged category/type: todo, insight, or journal';
COMMENT ON COLUMN entries.completed IS 'Whether a todo item is completed';

-- Migration helper: Populate 'type' from existing category/entry_type
-- This will set type based on existing data:
-- - If category='todo' -> type='todo'
-- - If category='insight' or 'idea' AND entry_type='thought' -> type='insight'  
-- - If entry_type='journal' -> type='journal'
UPDATE entries 
SET type = CASE
  WHEN category = 'todo' THEN 'todo'
  WHEN entry_type = 'journal' THEN 'journal'
  WHEN category IN ('insight', 'idea') AND entry_type = 'thought' THEN 'insight'
  ELSE 'insight' -- default fallback
END
WHERE type IS NULL;

