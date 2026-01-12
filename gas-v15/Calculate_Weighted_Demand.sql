-- ============================================================================
-- 📊 WEIGHTED DISTRIBUTION (3:2:1) DEMAND ANALYSIS (CORRECTED)
-- ============================================================================

WITH user_stats AS (
  SELECT 
    CASE 
      WHEN plan_name IN ('turbo_boost', 'weekly_boost') THEN 'Turbo (3x)'
      WHEN plan_name IN ('manager', 'supervisor') THEN 'Supervisor (2x)'
      ELSE 'Starter (1x)'
    END as plan_group,
    COUNT(*) as user_count,
    SUM(daily_limit) as total_capacity
  FROM users
  WHERE is_active = true 
  AND payment_status = 'active'
  AND role = 'member'
  GROUP BY 1
),
weighted_calc AS (
  SELECT 
    plan_group,
    user_count,
    total_capacity,
    CASE 
      WHEN plan_group LIKE 'Turbo%' THEN 3
      WHEN plan_group LIKE 'Supervisor%' THEN 2
      ELSE 1
    END as weight_per_cycle
  FROM user_stats
)
SELECT 
  plan_group as "Plan Group",
  user_count as "Active Users",
  weight_per_cycle as "Leads Per Cycle",
  (user_count * weight_per_cycle) as "Total Leads Needed (1 Cycle)",
  total_capacity as "Total Daily Capacity",
  ROUND((total_capacity::numeric / NULLIF(weight_per_cycle,0)), 1) as "Estimated Cycles to Full"
FROM weighted_calc

UNION ALL

SELECT 
  '--- TOTALS ---',
  SUM(user_count),
  NULL,
  SUM(user_count * weight_per_cycle),
  SUM(total_capacity),
  NULL
FROM weighted_calc;
