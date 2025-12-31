-- Migration: Add "Just a thought" to potential types
-- This adds the new "Just a thought" potential type to the existing potential system

-- Update potential columns to include "Just a thought"
ALTER TABLE thoughts DROP CONSTRAINT IF EXISTS thoughts_potential_check;
ALTER TABLE thoughts ADD CONSTRAINT thoughts_potential_check CHECK (potential IN ('Share', 'To-Do', 'Insight', 'Just a thought'));

ALTER TABLE thoughts DROP CONSTRAINT IF EXISTS thoughts_best_potential_check;
ALTER TABLE thoughts ADD CONSTRAINT thoughts_best_potential_check CHECK (best_potential IN ('Share', 'To-Do', 'Insight', 'Just a thought'));

