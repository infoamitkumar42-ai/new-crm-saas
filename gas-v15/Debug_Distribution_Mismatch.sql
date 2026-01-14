-- ============================================================================
-- 🕵️ DEBUG: HIGH LEADS VS ZERO LEADS (Audience Check)
-- ============================================================================

SELECT 
    name, 
    plan_name, 
    leads_today, 
    target_state, 
    target_gender,
    daily_limit
FROM users 
WHERE is_active = true 
  AND (leads_today >= 3 OR leads_today = 0)
ORDER BY leads_today DESC;
