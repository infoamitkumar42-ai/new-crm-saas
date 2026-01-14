-- ============================================================================
-- 🔍 WHO IS STILL AT ZERO? (With Filter Details)
-- ============================================================================

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
