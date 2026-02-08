-- ============================================================================
-- 📊 TEAM BREAKDOWN - SIMPLE VERSION (Using Only Existing Columns)
-- ============================================================================

-- Query 1: Active members by team
SELECT 
    CASE 
        WHEN team_code = 'TEAMFIRE' THEN 'Digital Chirag Team'
        WHEN team_code = 'TEAMRAJ' THEN 'Rajwinder Singh Team'
        WHEN team_code = 'GJ01TEAMFIRE' THEN 'Himanshu Sharma Team'
        ELSE team_code
    END as team_name,
    COUNT(*) as total_users,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_members,
    COUNT(CASE WHEN is_active = true AND payment_status = 'active' THEN 1 END) as paid_members,
    COUNT(CASE WHEN is_active = true AND (total_leads_received < total_leads_promised OR total_leads_promised IS NULL OR total_leads_promised = 0) THEN 1 END) as can_receive_leads
FROM users
WHERE team_code IN ('TEAMFIRE', 'TEAMRAJ', 'GJ01TEAMFIRE')
GROUP BY team_code
ORDER BY team_name;

-- Query 2: Daily requirement (assuming 100 leads per user)
SELECT 
    CASE 
        WHEN team_code = 'TEAMFIRE' THEN 'Digital Chirag'
        WHEN team_code = 'TEAMRAJ' THEN 'Rajwinder Singh'
        WHEN team_code = 'GJ01TEAMFIRE' THEN 'Himanshu Sharma'
    END as team,
    COUNT(CASE WHEN is_active = true AND (total_leads_received < total_leads_promised OR total_leads_promised IS NULL OR total_leads_promised = 0) THEN 1 END) as eligible_users,
    COUNT(CASE WHEN is_active = true AND (total_leads_received < total_leads_promised OR total_leads_promised IS NULL OR total_leads_promised = 0) THEN 1 END) * 100 as daily_need_if_100_each
FROM users
WHERE team_code IN ('TEAMFIRE', 'TEAMRAJ', 'GJ01TEAMFIRE')
GROUP BY team_code
ORDER BY team;

-- Query 3: Total summary
SELECT 
    COUNT(CASE WHEN is_active = true THEN 1 END) as total_active,
    COUNT(CASE WHEN is_active = true AND payment_status = 'active' THEN 1 END) as total_paid,
    COUNT(CASE WHEN is_active = true AND (total_leads_received < total_leads_promised OR total_leads_promised IS NULL OR total_leads_promised = 0) THEN 1 END) as can_receive_today,
    COUNT(CASE WHEN is_active = true AND (total_leads_received < total_leads_promised OR total_leads_promised IS NULL OR total_leads_promised = 0) THEN 1 END) * 100 as total_daily_need
FROM users
WHERE team_code IN ('TEAMFIRE', 'TEAMRAJ', 'GJ01TEAMFIRE');
