-- ============================================================================
-- 🚨 CHECK: Users Who Exceeded Their Quota After Counter Fix
-- ============================================================================

-- Query 1: Find users who are NOW over their quota
SELECT 
    name,
    email,
    plan_name,
    total_leads_received as received,
    total_leads_promised as quota,
    total_leads_received - total_leads_promised as over_by,
    is_active,
    payment_status,
    CASE 
        WHEN total_leads_received >= total_leads_promised THEN '🔴 QUOTA FULL'
        WHEN total_leads_received >= total_leads_promised * 0.9 THEN '🟡 90% USED'
        ELSE '🟢 ACTIVE'
    END as quota_status
FROM users
WHERE team_code IN ('TEAMFIRE', 'TEAMRAJ', 'GJ01TEAMFIRE')
  AND total_leads_promised IS NOT NULL 
  AND total_leads_promised > 0
  AND total_leads_received >= total_leads_promised
ORDER BY over_by DESC;

-- Query 2: Test if RPC blocks full users
-- This simulates what happens when webhook tries to assign lead
SELECT 
    user_id,
    user_name,
    user_email,
    plan_name,
    total_received,
    total_promised,
    CASE 
        WHEN total_received >= total_promised THEN '❌ BLOCKED - Quota Full'
        ELSE '✅ ELIGIBLE'
    END as assignment_status
FROM get_best_assignee_for_team('TEAMFIRE')
UNION ALL
SELECT 
    user_id,
    user_name,
    user_email,
    plan_name,
    total_received,
    total_promised,
    CASE 
        WHEN total_received >= total_promised THEN '❌ BLOCKED - Quota Full'
        ELSE '✅ ELIGIBLE'
    END
FROM get_best_assignee_for_team('TEAMRAJ')
UNION ALL
SELECT 
    user_id,
    user_name,
    user_email,
    plan_name,
    total_received,
    total_promised,
    CASE 
        WHEN total_received >= total_promised THEN '❌ BLOCKED - Quota Full'
        ELSE '✅ ELIGIBLE'
    END
FROM get_best_assignee_for_team('GJ01TEAMFIRE');

-- Query 3: Summary statistics
SELECT 
    team_code,
    COUNT(*) as total_users,
    COUNT(CASE WHEN total_leads_received >= total_leads_promised AND total_leads_promised > 0 THEN 1 END) as quota_full,
    COUNT(CASE WHEN total_leads_received < total_leads_promised OR total_leads_promised IS NULL OR total_leads_promised = 0 THEN 1 END) as still_eligible
FROM users
WHERE team_code IN ('TEAMFIRE', 'TEAMRAJ', 'GJ01TEAMFIRE')
  AND is_active = true
GROUP BY team_code;
