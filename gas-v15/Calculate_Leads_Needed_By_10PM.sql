-- ============================================================================
-- 📉 LEAD REQUIREMENT CALCULATION (By 10 PM)
-- ============================================================================

SELECT 
    plan_name,
    COUNT(*) as active_users,
    SUM(daily_limit) as total_capacity,
    SUM(leads_today) as filled_today,
    SUM(GREATEST(0, daily_limit - leads_today)) as leads_needed_by_10pm
FROM users 
WHERE payment_status = 'active' 
AND is_active = true
GROUP BY plan_name

UNION ALL

SELECT 
    'TOTAL' as plan_name,
    COUNT(*) as active_users,
    SUM(daily_limit) as total_capacity,
    SUM(leads_today) as filled_today,
    SUM(GREATEST(0, daily_limit - leads_today)) as leads_needed_by_10pm
FROM users 
WHERE payment_status = 'active' 
AND is_active = true;

-- 📝 NOTE:
-- This shows exactly how many leads are 'Missing' to hit everyone's limit.
-- If 'leads_needed_by_10pm' is 200, you should generate ~220 to be safe.
