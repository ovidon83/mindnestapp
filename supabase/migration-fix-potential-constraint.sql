-- Migration: Fix potential constraint to ensure "Just a thought" is included
-- This migration ensures the constraint allows "Just a thought" as a valid value

-- Drop ALL existing constraints on potential column (they might have different names)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Find and drop all check constraints on potential column
    FOR r IN (
        SELECT conname, conrelid::regclass
        FROM pg_constraint
        WHERE conrelid = 'thoughts'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) LIKE '%potential%'
    ) LOOP
        EXECUTE 'ALTER TABLE thoughts DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- Drop ALL existing constraints on best_potential column
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Find and drop all check constraints on best_potential column
    FOR r IN (
        SELECT conname, conrelid::regclass
        FROM pg_constraint
        WHERE conrelid = 'thoughts'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) LIKE '%best_potential%'
    ) LOOP
        EXECUTE 'ALTER TABLE thoughts DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- Now add the correct constraints with "Just a thought" included
ALTER TABLE thoughts 
ADD CONSTRAINT thoughts_potential_check 
CHECK (potential IS NULL OR potential IN ('Share', 'To-Do', 'Insight', 'Just a thought'));

ALTER TABLE thoughts 
ADD CONSTRAINT thoughts_best_potential_check 
CHECK (best_potential IS NULL OR best_potential IN ('Share', 'To-Do', 'Insight', 'Just a thought'));

-- Update any NULL potential values to 'Just a thought'
UPDATE thoughts 
SET potential = 'Just a thought'
WHERE potential IS NULL;

-- Update any NULL best_potential values to 'Just a thought' (if potential is also null)
UPDATE thoughts 
SET best_potential = 'Just a thought'
WHERE best_potential IS NULL AND potential IS NULL;

