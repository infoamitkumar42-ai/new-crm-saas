-- ============================================================================
-- 🔍 URGENT: Punjab Users at 0 (Who Should Have Got Leads)
-- ============================================================================

SELECT 
    name,
    plan_name,
    leads_today,
    target_state,
    target_gender
FROM users 
WHERE is_active = true 
  AND plan_name != 'none'
  AND daily_limit > 0
  AND target_state = 'Punjab'
ORDER BY leads_today ASC, name;
