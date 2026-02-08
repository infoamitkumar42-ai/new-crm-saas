-- ============================================================================
-- 📊 TEAM ANALYSIS & DAILY LEAD GENERATION REQUIREMENTS
-- ============================================================================

-- Query 1: Active members breakdown by team (manager)
SELECT 
    manager_id,
    manager_name,
    team_code,
    COUNT(*) as total_members,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_members,
    COUNT(CASE WHEN is_active = true AND payment_status = 'active' THEN 1 END) as active_paid_members,
    COUNT(CASE WHEN is_active = true AND (total_leads_received < total_leads_promised OR total_leads_promised IS NULL OR total_leads_promised = 0) THEN 1 END) as members_with_quota_remaining
FROM users
WHERE team_code IN ('TEAMFIRE', 'TEAMRAJ', 'GJ01TEAMFIRE')
GROUP BY manager_id, manager_name, team_code
ORDER BY team_code;

-- Query 2: Daily lead requirement calculation
SELECT 
    team_code,
    manager_name,
    COUNT(*) as active_members,
    AVG(COALESCE(planned_daily_limit, 100)) as avg_daily_limit,
    SUM(COALESCE(planned_daily_limit, 100)) as total_daily_capacity,
    COUNT(*) * 100 as estimated_daily_need_if_all_100,
    SUM(CASE WHEN total_leads_received < total_leads_promised OR total_leads_promised IS NULL OR total_leads_promised = 0 THEN COALESCE(planned_daily_limit, 100) ELSE 0 END) as actual_daily_need_with_quota
FROM users
WHERE team_code IN ('TEAMFIRE', 'TEAMRAJ', 'GJ01TEAMFIRE')
  AND is_active = true
GROUP BY team_code, manager_name
ORDER BY team_code;

-- Query 3: Detailed member list by team with daily limits
SELECT 
    team_code,
    manager_name,
    name as member_name,
    email,
    is_active,
    payment_status,
    COALESCE(planned_daily_limit, 100) as daily_limit,
    total_leads_received,
    total_leads_promised,
    CASE 
        WHEN total_leads_received >= total_leads_promised AND total_leads_promised > 0 THEN '🔴 Quota Full'
        WHEN is_active = false THEN '❌ Inactive'
        ELSE '✅ Active'
    END as status
FROM users
WHERE team_code IN ('TEAMFIRE', 'TEAMRAJ', 'GJ01TEAMFIRE')
ORDER BY team_code, is_active DESC, status;

-- Query 4: SUMMARY - Total leads needed today
SELECT 
    'TODAY LEAD REQUIREMENT' as summary,
    SUM(CASE WHEN is_active = true AND (total_leads_received < total_leads_promised OR total_leads_promised IS NULL OR total_leads_promised = 0) THEN COALESCE(planned_daily_limit, 100) ELSE 0 END) as total_leads_needed_today,
    COUNT(CASE WHEN is_active = true THEN 1 END) as total_active_members,
    COUNT(CASE WHEN is_active = true AND payment_status = 'active' THEN 1 END) as total_paid_members
FROM users
WHERE team_code IN ('TEAMFIRE', 'TEAMRAJ', 'GJ01TEAMFIRE');

-- Query 5: Breakdown by specific managers
SELECT 
    CASE 
        WHEN manager_name LIKE '%Chirag%' OR team_code = 'TEAMFIRE' THEN 'Digital Chirag Team'
        WHEN manager_name LIKE '%Himanshu%' THEN 'Himanshu Sharma Team'
        WHEN manager_name LIKE '%Rajwinder%' OR team_code = 'TEAMRAJ' THEN 'Rajwinder Singh Team'
        ELSE team_code
    END as team,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_members,
    COUNT(CASE WHEN is_active = true AND payment_status = 'active' THEN 1 END) as paid_members,
    SUM(CASE WHEN is_active = true THEN COALESCE(planned_daily_limit, 100) ELSE 0 END) as daily_capacity,
    SUM(CASE WHEN is_active = true AND (total_leads_received < total_leads_promised OR total_leads_promised IS NULL OR total_leads_promised = 0) THEN COALESCE(planned_daily_limit, 100) ELSE 0 END) as leads_needed_today
FROM users
WHERE team_code IN ('TEAMFIRE', 'TEAMRAJ', 'GJ01TEAMFIRE')
GROUP BY 
    CASE 
        WHEN manager_name LIKE '%Chirag%' OR team_code = 'TEAMFIRE' THEN 'Digital Chirag Team'
        WHEN manager_name LIKE '%Himanshu%' THEN 'Himanshu Sharma Team'
        WHEN manager_name LIKE '%Rajwinder%' OR team_code = 'TEAMRAJ' THEN 'Rajwinder Singh Team'
        ELSE team_code
    END
ORDER BY team;
