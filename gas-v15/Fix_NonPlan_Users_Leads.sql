-- =====================================================
-- FIX: Reassign leads from non-plan users to active plan users
-- Date: 2026-01-14
-- =====================================================

-- STEP 1: Check users with plan_name = 'none' who received leads today
SELECT 
    u.id,
    u.name,
    u.plan_name,
    u.is_active,
    u.leads_today,
    COUNT(l.id) as actual_leads_assigned
FROM users u
LEFT JOIN leads l ON l.user_id = u.id 
    AND l.created_at >= CURRENT_DATE 
    AND l.status = 'Assigned'
WHERE u.plan_name = 'none' OR u.plan_name IS NULL
GROUP BY u.id, u.name, u.plan_name, u.is_active, u.leads_today
HAVING COUNT(l.id) > 0
ORDER BY COUNT(l.id) DESC;

-- STEP 2: Show leads that need to be reassigned
SELECT 
    l.id as lead_id,
    l.name as lead_name,
    l.phone,
    l.city,
    l.created_at,
    u.name as assigned_to,
    u.plan_name
FROM leads l
JOIN users u ON l.user_id = u.id
WHERE l.created_at >= CURRENT_DATE
  AND l.status = 'Assigned'
  AND (u.plan_name = 'none' OR u.plan_name IS NULL);

-- STEP 3: Mark leads as 'New' (unassigned) so they can be redistributed
-- This will allow manual or automatic redistribution to active plan users
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
      AND (u.plan_name = 'none' OR u.plan_name IS NULL)
);

-- STEP 4: Reset leads_today count for non-plan users
UPDATE users
SET leads_today = 0, updated_at = NOW()
WHERE plan_name = 'none' OR plan_name IS NULL;

-- STEP 5: Verify - Show leads now available for redistribution
SELECT 
    id,
    name,
    phone,
    city,
    status,
    created_at
FROM leads
WHERE created_at >= CURRENT_DATE
  AND status = 'New'
  AND user_id IS NULL
ORDER BY created_at;

-- STEP 6: Show active plan users who can receive leads
SELECT 
    id,
    name,
    plan_name,
    daily_limit,
    leads_today,
    (daily_limit - COALESCE(leads_today, 0)) as can_receive
FROM users
WHERE is_active = true
  AND plan_name IS NOT NULL
  AND plan_name != 'none'
  AND leads_today < daily_limit
ORDER BY leads_today ASC;
