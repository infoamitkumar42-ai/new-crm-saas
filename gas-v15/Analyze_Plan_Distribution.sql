-- ============================================================================
-- 📊 PLAN DISTRIBUTION ANALYSIS (Who is getting leads?)
-- ============================================================================

-- 1. Total Assignments by Plan Today
SELECT 
    u.plan_name,
    COUNT(*) as leads_received,
    COUNT(DISTINCT u.id) as distinct_users_served
FROM leads l
JOIN users u ON l.user_id = u.id
WHERE (l.assigned_at AT TIME ZONE 'Asia/Kolkata')::date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date
GROUP BY u.plan_name
ORDER BY leads_received DESC;

-- 2. Check "Hungry" High Priority Users (Turbo/Supervisor)
-- Who are active, under limit, but have 0 leads?
SELECT 
    name, 
    plan_name, 
    leads_today, 
    daily_limit,
    target_state,
    target_gender
FROM users 
WHERE payment_status = 'active'
AND is_active = true
AND leads_today = 0
AND plan_name IN ('turbo_boost', 'weekly_boost', 'manager', 'supervisor')
ORDER BY plan_name DESC;
