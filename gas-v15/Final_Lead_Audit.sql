-- ============================================================================
-- FINAL LEAD AUDIT & RECOVERY PLAN
-- ============================================================================

-- 1. STUCK LEADS TIME-PERIOD ANALYSIS (The 158 leads)
-- Shows when these "Stuck" leads were born and who is holding them
SELECT 
    DATE_TRUNC('day', created_at) as lead_birthday,
    COUNT(*) as count,
    STRING_AGG(DISTINCT (SELECT name FROM users WHERE id = user_id), ', ' ) as managers_holding
FROM leads 
WHERE status = 'Assigned' 
  AND assigned_at < NOW() - INTERVAL '1 day'
GROUP BY 1
ORDER BY 1 ASC;

-- 2. TOTAL DISTRIBUTION VS PLAN QUOTAS (61+ Active Users)
-- This shows exactly who received how many vs their plan today
SELECT 
    u.name,
    u.email,
    u.plan_name,
    u.daily_limit as plan_quota,
    COUNT(l.id) as actual_leads_delivered_today,
    u.daily_limit - COUNT(l.id) as pending_quota_left,
    CASE 
        WHEN COUNT(l.id) >= u.daily_limit THEN '✅ FULL'
        WHEN COUNT(l.id) > 0 THEN '⏳ IN PROGRESS'
        ELSE '❌ NO LEADS'
    END as status
FROM users u
LEFT JOIN leads l ON l.user_id = u.id AND l.assigned_at >= CURRENT_DATE
WHERE u.role = 'member' 
  AND u.payment_status = 'active'
  AND u.is_active = true
GROUP BY u.id, u.name, u.email, u.plan_name, u.daily_limit
ORDER BY actual_leads_delivered_today DESC;

-- 3. RESET & RECOVERY COMMANDS (Run these after verifying above)
-- These will fix the 158 stuck leads and sync the counters
/*
-- UNCOMMENT TO RUN:
-- A. Move stuck leads back to New pool
UPDATE leads 
SET user_id = NULL, status = 'New', assigned_at = NULL 
WHERE status = 'Assigned' AND assigned_at < NOW() - INTERVAL '1 day';

-- B. Sync user counters (Fixing the leads_today column)
UPDATE users u
SET leads_today = (
    SELECT COUNT(*) FROM leads l 
    WHERE l.user_id = u.id AND l.assigned_at >= CURRENT_DATE
);
*/
