-- ============================================================================
-- 🔍 ZERO LEAD USERS: WHY ANALYSIS
-- ============================================================================

-- Breakdown by Plan Type
SELECT 
    plan_name,
    COUNT(*) as zero_lead_count,
    daily_limit
FROM users 
WHERE is_active = true AND leads_today = 0
GROUP BY plan_name, daily_limit
ORDER BY zero_lead_count DESC;

-- Breakdown by State Filter
SELECT 
    target_state,
    COUNT(*) as zero_lead_count
FROM users 
WHERE is_active = true AND leads_today = 0
GROUP BY target_state
ORDER BY zero_lead_count DESC;

-- Critical Users (Have Valid Plans but Still 0)
SELECT 
    name,
    plan_name,
    target_state,
    target_gender,
    daily_limit
FROM users 
WHERE is_active = true 
  AND leads_today = 0 
  AND plan_name != 'none'
  AND daily_limit > 0
ORDER BY plan_name, target_state;
