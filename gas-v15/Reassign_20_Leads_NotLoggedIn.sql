-- =====================================================
-- REASSIGN 20 LEADS from users who haven't logged in today
-- Date: 2026-01-14
-- =====================================================

-- ========== STEP 1: Show the 13 users who got leads but NOT logged in ==========
SELECT 
    u.id,
    u.name,
    u.plan_name,
    u.last_activity,
    COUNT(l.id) as leads_to_reassign
FROM users u
JOIN leads l ON l.user_id = u.id 
    AND l.created_at >= CURRENT_DATE 
    AND l.status = 'Assigned'
WHERE u.last_activity < CURRENT_DATE OR u.last_activity IS NULL
GROUP BY u.id, u.name, u.plan_name, u.last_activity
ORDER BY COUNT(l.id) DESC;

-- ========== STEP 2: Show the 20 leads that need reassignment ==========
SELECT 
    l.id as lead_id,
    l.name as lead_name,
    l.phone,
    l.city,
    l.state,
    l.assigned_at,
    u.name as currently_assigned_to,
    u.plan_name,
    u.last_activity
FROM leads l
JOIN users u ON l.user_id = u.id
WHERE l.created_at >= CURRENT_DATE
  AND l.status = 'Assigned'
  AND (u.last_activity < CURRENT_DATE OR u.last_activity IS NULL);

-- ========== STEP 3: REASSIGN - Mark these 20 leads as New ==========
UPDATE leads
SET 
    status = 'New',
    user_id = NULL,
    assigned_at = NULL,
    updated_at = NOW()
WHERE id IN (
    SELECT l.id
    FROM leads l
    JOIN users u ON l.user_id = u.id
    WHERE l.created_at >= CURRENT_DATE
      AND l.status = 'Assigned'
      AND (u.last_activity < CURRENT_DATE OR u.last_activity IS NULL)
);

-- ========== STEP 4: Reduce leads_today count for those 13 users ==========
UPDATE users u
SET 
    leads_today = GREATEST(0, COALESCE(u.leads_today, 0) - sub.lead_count),
    updated_at = NOW()
FROM (
    SELECT user_id, COUNT(*) as lead_count
    FROM leads
    WHERE created_at >= CURRENT_DATE
      AND status = 'New'
      AND user_id IS NULL
    GROUP BY user_id
) sub
WHERE u.id = sub.user_id
  AND (u.last_activity < CURRENT_DATE OR u.last_activity IS NULL);

-- Simple fix - just recalculate based on actual assigned leads
UPDATE users u
SET leads_today = (
    SELECT COUNT(*) 
    FROM leads l 
    WHERE l.user_id = u.id 
      AND l.created_at >= CURRENT_DATE 
      AND l.status = 'Assigned'
),
updated_at = NOW()
WHERE last_activity < CURRENT_DATE OR last_activity IS NULL;

-- ========== STEP 5: Verify - 20 leads now available ==========
SELECT 
    id, name, phone, city, state, status, created_at
FROM leads
WHERE created_at >= CURRENT_DATE
  AND status = 'New'
  AND user_id IS NULL
ORDER BY created_at DESC;

-- ========== STEP 6: Active users ready to receive (logged in today) ==========
SELECT 
    id, name, plan_name, daily_limit, leads_today,
    (daily_limit - COALESCE(leads_today, 0)) as can_receive
FROM users
WHERE is_active = true
  AND plan_name IS NOT NULL
  AND plan_name != 'none'
  AND leads_today < daily_limit
  AND last_activity >= CURRENT_DATE  -- Only users who logged in today
ORDER BY leads_today ASC
LIMIT 20;
