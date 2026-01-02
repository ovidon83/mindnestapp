-- Check current constraint on potential column
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'thoughts'::regclass
  AND conname LIKE '%potential%';
