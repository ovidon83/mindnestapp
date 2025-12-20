-- Migration: Add Instagram image URL column to posts table
-- This stores the DALL-E generated image URL

-- Add Instagram image URL column
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS instagram_image_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN posts.instagram_image_url IS 'URL of the DALL-E generated image for Instagram post';

