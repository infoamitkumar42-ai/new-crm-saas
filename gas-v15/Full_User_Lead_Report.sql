-- ============================================================================
-- 📊 COMPLETE USER LEAD DISTRIBUTION REPORT
-- ============================================================================

-- 1. Summary by Lead Count
SELECT 
    leads_today,
    COUNT(*) as users_at_this_level
FROM users 
WHERE is_active = true AND plan_name != 'none' AND daily_limit > 0
GROUP BY leads_today
ORDER BY leads_today ASC;

-- 2. Full User List (Sorted by leads_today)
SELECT 
    name,
    plan_name,
    leads_today,
    daily_limit,
    target_state
FROM users 
WHERE is_active = true AND plan_name != 'none' AND daily_limit > 0
ORDER BY leads_today ASC, plan_name, name;
