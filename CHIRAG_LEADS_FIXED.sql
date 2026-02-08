
-- ============================================================================
-- 🚀 FIXED MANUAL LEAD DISTRIBUTION (CHIRAG TEAM)
-- ============================================================================

BEGIN;

-- 1. UNLOCK TARGET TEAM (Ensure they are ready)
UPDATE users 
SET daily_limit = 1000, 
    is_active = true, 
    is_online = true 
WHERE team_code = 'GJ01TEAMFIRE' 
  AND plan_name IN ('starter', 'supervisor', 'manager', 'weekly_boost', 'turbo_boost');

-- 2. INSERT & DISTRIBUTE
WITH new_leads_data (full_name, phone_number, city, source, lead_created_at) AS (
    VALUES
    ('Dharmesh Donda', '9624249683', 'Surat', 'New chirag campaing (ig)', '2026-02-05T18:02:08+05:30'),
    ('Francis Broachwala', '7041846785', 'Vadodara', 'New chirag campaing (ig)', '2026-02-05T17:54:18+05:30'),
    -- ... (I will instruct user to PASTE the rest here) ...
    ('Ramesh Pranami', '9429811324', 'Vadodara', 'New chirag campaing – 2 (ig)', '2026-02-05T15:10:36+05:30')
    -- (The user has the full list, I am providing the WRAPPER logic)
),
active_team AS (
    SELECT id 
    FROM users
    WHERE team_code = 'GJ01TEAMFIRE' 
      AND is_active = true 
    ORDER BY id
),
team_stats AS (
    SELECT count(*) as total FROM active_team
),
numbered_leads AS (
    SELECT 
        nld.*, 
        ROW_NUMBER() OVER (ORDER BY nld.lead_created_at) as r_num
    FROM new_leads_data nld
    WHERE NOT EXISTS (
        SELECT 1 FROM leads l WHERE l.phone_number = nld.phone_number
    )
),
assignments AS (
    SELECT 
        nl.*,
        at.id as assigned_user_id
    FROM numbered_leads nl
    CROSS JOIN team_stats ts
    JOIN active_team at ON at.id = (
        SELECT id FROM active_team 
        OFFSET (nl.r_num - 1) % CASE WHEN ts.total = 0 THEN 1 ELSE ts.total END LIMIT 1
    )
)
INSERT INTO leads (full_name, phone_number, city, source, status, assigned_to, created_at)
SELECT 
    full_name, 
    phone_number, 
    city, 
    source, 
    'Assigned', 
    assigned_user_id, 
    lead_created_at::timestamptz
FROM assignments
ON CONFLICT (phone_number) DO NOTHING;

COMMIT;

-- 3. VERIFY
SELECT count(*) as new_leads_today FROM leads 
WHERE created_at >= CURRENT_DATE 
AND source LIKE '%chirag%';
