-- ============================================================================
-- 🕵️ VERIFY FAIR ROTATION (ROUND-ROBIN)
-- ============================================================================

-- 1. Check current lead distribution and last assignment time
SELECT 
    name, 
    leads_today, 
    last_assigned_at,
    (daily_limit - leads_today) as remaining_quota
FROM users 
WHERE is_active = true 
  AND is_online = true 
  AND team_code = (SELECT team_code FROM users WHERE name ILIKE '%Jashandeep%' LIMIT 1)
ORDER BY leads_today ASC, last_assigned_at ASC NULLS FIRST;

-- 2. Check the very next user in line for an assignment
SELECT * FROM get_best_assignee_for_team((SELECT team_code FROM users WHERE name ILIKE '%Jashandeep%' LIMIT 1));
