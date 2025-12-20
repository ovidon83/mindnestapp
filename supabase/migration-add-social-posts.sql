-- Migration: Add Twitter/X and Instagram content to posts table
-- This adds columns for Twitter/X post content and Instagram post content + image prompt

-- Add Twitter/X content column
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS twitter_content TEXT;

-- Add Instagram content column
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS instagram_content TEXT;

-- Add Instagram image prompt/description column
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS instagram_image_prompt TEXT;

-- Add comment for documentation
COMMENT ON COLUMN posts.twitter_content IS 'AI-generated Twitter/X post content (280 characters max)';
COMMENT ON COLUMN posts.instagram_content IS 'AI-generated Instagram post caption';
COMMENT ON COLUMN posts.instagram_image_prompt IS 'AI-generated image description/prompt for Instagram post image';

