-- ============================================================================
-- 📊 SIMPLE TEAM BREAKDOWN & DAILY LEAD REQUIREMENTS
-- ============================================================================

-- Query 1: Team breakdown with daily requirements
SELECT 
    CASE 
        WHEN team_code = 'TEAMFIRE' THEN 'Digital Chirag Team'
        WHEN team_code = 'TEAMRAJ' THEN 'Rajwinder Singh Team'
        WHEN team_code = 'GJ01TEAMFIRE' THEN 'Himanshu Sharma Team'
        ELSE team_code
    END as team_name,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_members,
    COUNT(CASE WHEN is_active = true AND payment_status = 'active' THEN 1 END) as paid_members,
    SUM(CASE WHEN is_active = true THEN COALESCE(planned_daily_limit, 100) ELSE 0 END) as daily_capacity,
    SUM(CASE WHEN is_active = true AND (total_leads_received < total_leads_promised OR total_leads_promised IS NULL OR total_leads_promised = 0) THEN COALESCE(planned_daily_limit, 100) ELSE 0 END) as leads_needed_today
FROM users
WHERE team_code IN ('TEAMFIRE', 'TEAMRAJ', 'GJ01TEAMFIRE')
GROUP BY team_code
ORDER BY team_name;

-- Query 2: Overall summary
SELECT 
    SUM(CASE WHEN is_active = true AND (total_leads_received < total_leads_promised OR total_leads_promised IS NULL OR total_leads_promised = 0) THEN COALESCE(planned_daily_limit, 100) ELSE 0 END) as total_leads_needed_today,
    COUNT(CASE WHEN is_active = true THEN 1 END) as total_active_members,
    COUNT(CASE WHEN is_active = true AND payment_status = 'active' THEN 1 END) as total_paid_members
FROM users
WHERE team_code IN ('TEAMFIRE', 'TEAMRAJ', 'GJ01TEAMFIRE');

-- Query 3: Detailed member breakdown (top 20 active)
SELECT 
    CASE 
        WHEN team_code = 'TEAMFIRE' THEN 'Digital Chirag'
        WHEN team_code = 'TEAMRAJ' THEN 'Rajwinder Singh'
        WHEN team_code = 'GJ01TEAMFIRE' THEN 'Himanshu Sharma'
    END as team,
    name,
    email,
    payment_status,
    COALESCE(planned_daily_limit, 100) as daily_limit,
    total_leads_received,
    total_leads_promised,
    total_leads_promised - total_leads_received as remaining_quota
FROM users
WHERE team_code IN ('TEAMFIRE', 'TEAMRAJ', 'GJ01TEAMFIRE')
  AND is_active = true
  AND (total_leads_received < total_leads_promised OR total_leads_promised IS NULL OR total_leads_promised = 0)
ORDER BY team, daily_limit DESC
LIMIT 20;
