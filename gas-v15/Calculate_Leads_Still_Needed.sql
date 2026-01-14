-- ============================================================================
-- 📊 LEADS NEEDED TO FILL ALL QUOTAS
-- ============================================================================

-- Summary: Total Demand vs Supply
SELECT 
    SUM(daily_limit) as total_daily_capacity,
    SUM(leads_today) as total_leads_given,
    SUM(daily_limit - leads_today) as leads_still_needed,
    COUNT(*) as total_active_users
FROM users 
WHERE is_active = true AND plan_name != 'none' AND daily_limit > 0;

-- Breakdown by Plan
SELECT 
    plan_name,
    COUNT(*) as users,
    SUM(daily_limit) as total_capacity,
    SUM(leads_today) as leads_given,
    SUM(daily_limit - leads_today) as leads_needed
FROM users 
WHERE is_active = true AND plan_name != 'none' AND daily_limit > 0
GROUP BY plan_name
ORDER BY leads_needed DESC;
