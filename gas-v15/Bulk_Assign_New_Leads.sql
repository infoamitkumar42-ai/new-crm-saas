-- =====================================================
-- BULK ASSIGN: Distribute New leads to Active Users (Logged in today)
-- Date: 2026-01-14
-- =====================================================

-- Step 1: Check how many leads to distribute vs capacity
SELECT 
    'New Leads Available' as metric,
    COUNT(*) as count
FROM leads 
WHERE created_at >= CURRENT_DATE 
  AND status = 'New' 
  AND user_id IS NULL

UNION ALL

SELECT 
    'Active Users Capacity' as metric,
    SUM(daily_limit - COALESCE(leads_today, 0)) as count
FROM users
WHERE is_active = true
  AND plan_name IS NOT NULL
  AND plan_name != 'none'
  AND leads_today < daily_limit
  AND last_activity >= CURRENT_DATE;

-- Step 2: Auto-assign leads using round-robin to eligible users
-- This assigns one lead at a time to users with lowest leads_today
WITH eligible_users AS (
    SELECT id, name, daily_limit, leads_today, target_state, target_gender
    FROM users
    WHERE is_active = true
      AND plan_name IS NOT NULL
      AND plan_name != 'none'
      AND leads_today < daily_limit
      AND last_activity >= CURRENT_DATE
),
new_leads AS (
    SELECT id, name, phone, city, state,
           ROW_NUMBER() OVER (ORDER BY created_at) as lead_num
    FROM leads
    WHERE created_at >= CURRENT_DATE
      AND status = 'New'
      AND user_id IS NULL
    LIMIT 100
),
assignments AS (
    SELECT 
        nl.id as lead_id,
        eu.id as user_id,
        eu.name as user_name
    FROM new_leads nl
    CROSS JOIN LATERAL (
        SELECT id, name
        FROM eligible_users eu
        WHERE eu.leads_today + (
            SELECT COUNT(*) FROM new_leads nl2 
            WHERE nl2.lead_num < nl.lead_num 
              AND nl2.id IN (SELECT lead_id FROM assignments WHERE user_id = eu.id)
        ) < eu.daily_limit
        ORDER BY eu.leads_today ASC
        LIMIT 1
    ) eu
)
SELECT * FROM assignments;

-- Step 3: SIMPLER APPROACH - Assign leads one by one
-- Run this multiple times or create a function

-- First, let's just update the first batch (one lead per user)
UPDATE leads l
SET 
    user_id = u.id,
    status = 'Assigned',
    assigned_at = NOW(),
    updated_at = NOW()
FROM (
    SELECT 
        l2.id as lead_id,
        u2.id as user_id
    FROM (
        SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
        FROM leads
        WHERE created_at >= CURRENT_DATE
          AND status = 'New'
          AND user_id IS NULL
        LIMIT 50
    ) l2
    JOIN (
        SELECT id, ROW_NUMBER() OVER (ORDER BY leads_today, id) as rn
        FROM users
        WHERE is_active = true
          AND plan_name IS NOT NULL
          AND plan_name != 'none'
          AND leads_today < daily_limit
          AND last_activity >= CURRENT_DATE
        LIMIT 50
    ) u2 ON l2.rn = u2.rn
) matched
WHERE l.id = matched.lead_id;

-- Step 4: Update leads_today counts for all users
UPDATE users u
SET leads_today = (
    SELECT COUNT(*) 
    FROM leads l 
    WHERE l.user_id = u.id 
      AND l.created_at >= CURRENT_DATE 
      AND l.status = 'Assigned'
),
updated_at = NOW()
WHERE is_active = true;

-- Step 5: Verify distribution
SELECT 
    u.name,
    u.plan_name,
    u.daily_limit,
    u.leads_today,
    (u.daily_limit - u.leads_today) as remaining
FROM users u
WHERE is_active = true
  AND plan_name IS NOT NULL
  AND plan_name != 'none'
ORDER BY leads_today DESC;
