-- ============================================================================
-- MANUAL DISTRIBUTION: Night_Backlog Leads (Jan 17, 2026)
-- ============================================================================
-- This script will take Night_Backlog leads and manually distribute them
-- to eligible users based on round-robin logic

-- Step 1: Check current Night_Backlog count
SELECT COUNT(*) as backlog_count
FROM leads
WHERE status = 'Night_Backlog'
  AND user_id IS NULL
  AND created_at >= '2026-01-17 00:00:00'::timestamptz;

-- Step 2: Get eligible users (sorted by priority and leads_today)
WITH eligible_users AS (
    SELECT 
        id,
        name,
        plan_name,
        leads_today,
        daily_limit,
        CASE plan_name
            WHEN 'turbo_boost' THEN 1
            WHEN 'weekly_boost' THEN 1
            WHEN 'manager' THEN 2
            WHEN 'supervisor' THEN 3
            WHEN 'starter' THEN 4
            ELSE 5
        END as priority
    FROM users
    WHERE is_active = true
      AND plan_name != 'none'
      AND daily_limit > 0
      AND leads_today < daily_limit
      AND valid_until > NOW()
      AND last_activity > NOW() - INTERVAL '7 days'
    ORDER BY priority ASC, leads_today ASC
)
SELECT * FROM eligible_users;

-- Step 3: Distribute Night_Backlog leads to users
-- (This is a template - adjust user IDs based on Step 2 results)

-- Example: Distribute to first eligible user
-- WITH next_lead AS (
--     SELECT id
--     FROM leads
--     WHERE status = 'Night_Backlog'
--       AND user_id IS NULL
--       AND created_at >= '2026-01-17 00:00:00'::timestamptz
--     ORDER BY created_at ASC
--     LIMIT 1
-- ),
-- next_user AS (
--     SELECT id FROM eligible_users LIMIT 1
-- )
-- UPDATE leads
-- SET 
--     user_id = (SELECT id FROM next_user),
--     assigned_to = (SELECT id FROM next_user),
--     status = 'Assigned',
--     assigned_at = NOW(),
--     source = source || ' [Night->Day]'
-- WHERE id = (SELECT id FROM next_lead)
-- RETURNING *;

-- ❌ CAUTION: The above UPDATE is commented for safety!
-- Recommended: Use a script to loop through and assign one-by-one
