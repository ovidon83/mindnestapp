-- Add unique constraint to prevent multiple posts for the same entry
-- This ensures one entry can only have one post

-- First, remove any duplicate posts (keep the first one for each entry_id)
DELETE FROM posts
WHERE id NOT IN (
  SELECT DISTINCT ON (entry_id) id
  FROM posts
  ORDER BY entry_id, created_at ASC
);

-- Add unique constraint
ALTER TABLE posts
ADD CONSTRAINT posts_user_entry_unique UNIQUE (user_id, entry_id);

