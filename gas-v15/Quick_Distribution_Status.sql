-- ============================================================================
-- 📊 QUICK STATUS: Lead Distribution Summary
-- ============================================================================

-- How many users at each lead count
SELECT 
    leads_today,
    COUNT(*) as user_count
FROM users 
WHERE is_active = true AND plan_name != 'none' AND daily_limit > 0
GROUP BY leads_today
ORDER BY leads_today ASC;
