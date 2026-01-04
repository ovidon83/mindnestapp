-- Migration: Add explore_recommendations column to thoughts table
-- This column stores AI-generated recommendations for the Explore view (cached to avoid re-analyzing)

ALTER TABLE thoughts 
ADD COLUMN IF NOT EXISTS explore_recommendations JSONB DEFAULT NULL;

COMMENT ON COLUMN thoughts.explore_recommendations IS 'AI-generated recommendations for Explore view, cached when thought is first created. Array of {type, explanation, value, confidence} objects.';

