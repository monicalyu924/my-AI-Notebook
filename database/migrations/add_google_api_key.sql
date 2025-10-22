-- Migration: Add google_api_key column to users table
-- Date: 2025-10-22
-- Description: Support for Nano Banana (Google Gemini) image generation API

-- Add google_api_key column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS google_api_key TEXT;

-- Add comment to the column
COMMENT ON COLUMN users.google_api_key IS 'Google API key for Nano Banana image generation (Gemini 2.5 Flash Image Preview)';

-- Optional: Create an index if needed for performance
-- CREATE INDEX IF NOT EXISTS idx_users_google_api_key ON users(google_api_key) WHERE google_api_key IS NOT NULL;
