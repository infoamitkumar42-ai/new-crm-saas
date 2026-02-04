-- IRON DOME MIGRATION: TEAM ISOLATION
-- Run this in Supabase SQL Editor

BEGIN;

-- 1. Add team_id to 'users' table regarding strict isolation
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS team_id TEXT DEFAULT 'TEAM_PUNJAB';

-- 2. Add team_id to 'meta_pages' table regarding source isolation
ALTER TABLE meta_pages 
ADD COLUMN IF NOT EXISTS team_id TEXT DEFAULT 'TEAM_PUNJAB';

-- 3. Backfill existing data (Safety Net)
-- Everyone currently in the system is assumed to be Himanshu's team (Punjab)
UPDATE users SET team_id = 'TEAM_PUNJAB' WHERE team_id IS NULL;
UPDATE meta_pages SET team_id = 'TEAM_PUNJAB' WHERE team_id IS NULL;

-- 4. Create Indexes for faster lookup during Webhook execution
CREATE INDEX IF NOT EXISTS idx_users_team_id ON users(team_id);
CREATE INDEX IF NOT EXISTS idx_meta_pages_team_id ON meta_pages(team_id);

COMMIT;

-- VERIFICATION QUERY (Run looking for 'TEAM_PUNJAB'):
-- SELECT email, team_id FROM users LIMIT 5;
