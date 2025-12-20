-- Migration: Add entry_type column to entries table
-- Run this if you already have an existing entries table

-- Add entry_type column with default value
ALTER TABLE entries 
ADD COLUMN IF NOT EXISTS entry_type TEXT DEFAULT 'thought' CHECK (entry_type IN ('thought', 'journal'));

-- Update existing entries to have 'thought' as default
UPDATE entries 
SET entry_type = 'thought' 
WHERE entry_type IS NULL;

-- Make entry_type NOT NULL after setting defaults
ALTER TABLE entries 
ALTER COLUMN entry_type SET NOT NULL;

-- Create index for entry_type
CREATE INDEX IF NOT EXISTS entries_entry_type_idx ON entries(entry_type);

