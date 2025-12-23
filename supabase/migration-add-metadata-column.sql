-- Migration: Add metadata column to entries table
-- This column stores AI-generated metadata about thoughts (actionable, shareable, recurring, etc.)

ALTER TABLE entries 
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add comment
COMMENT ON COLUMN entries.metadata IS 'AI-generated metadata describing thought potential (actionable, shareable, recurring, thematic, hasDate, hasMultipleActions, sentiment)';

