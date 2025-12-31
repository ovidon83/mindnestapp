-- Migration: Set "Just a thought" as default potential for thoughts without a potential
-- This ensures all thoughts have a potential assigned

-- Update thoughts that have NULL for both potential and best_potential
UPDATE thoughts 
SET 
  potential = 'Just a thought',
  best_potential = 'Just a thought'
WHERE potential IS NULL 
  AND best_potential IS NULL;

-- Update thoughts that have best_potential but no potential
UPDATE thoughts 
SET potential = best_potential
WHERE potential IS NULL 
  AND best_potential IS NOT NULL;

-- Update thoughts that have potential but no best_potential
UPDATE thoughts 
SET best_potential = potential
WHERE potential IS NOT NULL 
  AND best_potential IS NULL;

