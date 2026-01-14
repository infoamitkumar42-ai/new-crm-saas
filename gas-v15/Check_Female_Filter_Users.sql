-- ============================================================================
-- 🔍 CHECK: All Female-Filter Users - Who got leads, who didn't?
-- ============================================================================

SELECT 
    name,
    plan_name,
    leads_today,
    daily_limit,
    target_state,
    target_gender,
    ROUND((leads_today::decimal / NULLIF(daily_limit, 0)) * 100) as percent_filled
FROM users 
WHERE is_active = true 
  AND plan_name != 'none'
  AND daily_limit > 0
  AND target_gender = 'Female'
ORDER BY percent_filled ASC;
