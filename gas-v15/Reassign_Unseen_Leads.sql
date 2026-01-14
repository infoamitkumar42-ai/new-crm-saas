-- =====================================================
-- URGENT: Reassign leads from non-plan users WHO HAVEN'T LOGGED IN TODAY
-- Only for users who haven't seen their leads yet
-- Date: 2026-01-14
-- =====================================================

-- ========== STEP 1: NON-PLAN USERS WHO GOT LEADS BUT NOT LOGGED IN TODAY ==========
-- These are the leads we will REASSIGN (user hasn't seen them)
SELECT 
    u.id as user_id,
    u.name,
    u.plan_name,
    u.last_activity,
    CASE 
        WHEN u.last_activity >= CURRENT_DATE THEN '✅ LOGGED IN TODAY - KEEP'
        ELSE '❌ NOT LOGGED IN - REASSIGN'
    END as action,
    COUNT(l.id) as leads_to_reassign
FROM users u
JOIN leads l ON l.user_id = u.id 
    AND l.created_at >= CURRENT_DATE 
    AND l.status = 'Assigned'
WHERE (u.plan_name = 'none' OR u.plan_name IS NULL)
GROUP BY u.id, u.name, u.plan_name, u.last_activity
ORDER BY 
    CASE WHEN u.last_activity >= CURRENT_DATE THEN 1 ELSE 0 END,
    COUNT(l.id) DESC;

-- ========== STEP 2: SHOW EXACT LEADS TO REASSIGN ==========
-- Only from users who HAVEN'T logged in today
SELECT 
    l.id as lead_id,
    l.name as lead_name,
    l.phone,
    l.city,
    l.created_at,
    u.name as wrong_assigned_to,
    u.plan_name,
    u.last_activity
FROM leads l
JOIN users u ON l.user_id = u.id
WHERE l.created_at >= CURRENT_DATE
  AND l.status = 'Assigned'
  AND (u.plan_name = 'none' OR u.plan_name IS NULL)
  AND (u.last_activity IS NULL OR u.last_activity < CURRENT_DATE);

-- ========== STEP 3: REASSIGN - Mark leads as New ==========
-- Only for non-plan users who haven't logged in today
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
      AND (u.last_activity IS NULL OR u.last_activity < CURRENT_DATE)
);

-- ========== STEP 4: Reset leads_today for those non-plan users ==========
UPDATE users
SET leads_today = 0, updated_at = NOW()
WHERE (plan_name = 'none' OR plan_name IS NULL)
  AND (last_activity IS NULL OR last_activity < CURRENT_DATE);

-- ========== STEP 5: Leads now available for redistribution ==========
SELECT 
    id, name, phone, city, status, created_at
FROM leads
WHERE created_at >= CURRENT_DATE
  AND status = 'New'
  AND user_id IS NULL
ORDER BY created_at;

-- ========== STEP 6: Active plan users ready to receive ==========
SELECT 
    id, name, plan_name, daily_limit, leads_today,
    (daily_limit - COALESCE(leads_today, 0)) as can_receive
FROM users
WHERE is_active = true
  AND plan_name IS NOT NULL
  AND plan_name != 'none'
  AND leads_today < daily_limit
ORDER BY leads_today ASC;
