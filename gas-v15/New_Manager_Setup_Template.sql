-- ============================================================================
-- 🚀 NEW MANAGER SETUP TEMPLATE (CORRECT COLUMNS)
-- Copy this, fill details, run in Supabase SQL
-- ============================================================================

-- Step 1: Add Manager's Page
INSERT INTO connected_pages (page_id, page_name, access_token, token_expires_at, manager_name, manager_email)
VALUES (
    'PAGE_ID_HERE',                    -- Facebook Page ID
    'PAGE_NAME_HERE',                  -- Page Name
    'LONG_LIVED_ACCESS_TOKEN_HERE',    -- Page Access Token (60 days)
    '2026-03-14',                      -- Token expiry date
    'MANAGER_NAME_HERE',               -- Manager Name
    'manager@email.com'                -- Manager Email
);

-- Step 2: Add Team Members (Using correct columns)
INSERT INTO users (id, name, email, plan_name, daily_limit, is_active, target_gender, target_state, role)
VALUES 
    (gen_random_uuid(), 'Team Member 1', 'member1@gmail.com', 'starter', 10, true, 'Female', 'Punjab', 'member'),
    (gen_random_uuid(), 'Team Member 2', 'member2@gmail.com', 'starter', 10, true, 'Female', 'Punjab', 'member'),
    (gen_random_uuid(), 'Team Member 3', 'member3@gmail.com', 'supervisor', 10, true, 'Female', 'Punjab', 'member');

-- Plan options: 'supervisor', 'weekly_boost', 'manager', 'starter'

-- Step 3: Verify
SELECT * FROM connected_pages ORDER BY created_at DESC LIMIT 1;
SELECT name, email, plan_name, daily_limit, target_gender, target_state FROM users ORDER BY created_at DESC LIMIT 5;

-- ============================================================================
-- After running this SQL, go to Graph API Explorer and run:
-- POST: {PAGE_ID}/subscribed_apps?subscribed_fields=leadgen
-- ============================================================================
