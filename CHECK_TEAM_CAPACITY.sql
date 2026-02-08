-- ============================================================================
-- 🕵️ CHECK TEAM CAPACITY (Why are leads stuck?)
-- ============================================================================

-- Query 1: Analyzie GJ01TEAMFIRE Active Users
SELECT 
    id,
    name,
    email,
    is_active,
    is_online,
    leads_today,
    daily_limit,
    total_leads_received,
    total_leads_promised,
    CASE 
        WHEN NOT is_active THEN '❌ Inactive'
        WHEN NOT is_online THEN '❌ Offline'
        WHEN leads_today >= daily_limit THEN '❌ Daily Limit Reached'
        WHEN total_leads_received >= total_leads_promised THEN '❌ Total Quota Reached'
        ELSE '✅ ELIGIBLE'
    END as status
FROM users
WHERE team_code = 'GJ01TEAMFIRE'
ORDER BY status DESC, name;

-- Query 2: Analyze TEAMFIRE Active Users
SELECT 
    id,
    name,
    email,
    is_active,
    is_online,
    leads_today,
    daily_limit,
    total_leads_received,
    total_leads_promised,
    CASE 
        WHEN NOT is_active THEN '❌ Inactive'
        WHEN NOT is_online THEN '❌ Offline'
        WHEN leads_today >= daily_limit THEN '❌ Daily Limit Reached'
        WHEN total_leads_received >= total_leads_promised THEN '❌ Total Quota Reached'
        ELSE '✅ ELIGIBLE'
    END as status
FROM users
WHERE team_code = 'TEAMFIRE'
ORDER BY status DESC, name;

-- Query 3: Count of Unassigned Leads by Team (estimated from source)
SELECT 
    CASE 
        WHEN source ILIKE '%Chirag%' THEN 'GJ01TEAMFIRE'
        WHEN source ILIKE '%Himanshu%' THEN 'TEAMFIRE'
        WHEN source ILIKE '%Rajwinder%' THEN 'TEAMRAJ'
        ELSE 'Unknown'
    END as estimated_team,
    COUNT(*) as waiting_leads
FROM leads
WHERE assigned_to IS NULL AND created_at >= CURRENT_DATE
GROUP BY 1;
