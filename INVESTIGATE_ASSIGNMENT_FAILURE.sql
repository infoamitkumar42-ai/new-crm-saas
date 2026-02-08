-- ============================================================================
-- 🚨 INVESTIGATE: Why Are Leads Not Being Assigned?
-- ============================================================================

-- Query 1: Check the unassigned leads details
SELECT 
    id,
    name,
    phone,
    city,
    source,
    status,
    created_at,
    user_id,
    assigned_to,
    assigned_at,
    EXTRACT(EPOCH FROM (NOW() - created_at)) / 60 as minutes_old
FROM leads
WHERE created_at >= NOW() - INTERVAL '1 hour'
  AND assigned_to IS NULL
ORDER BY created_at DESC;

-- Query 2: Check if ANY leads were assigned today
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    COUNT(*) as total,
    COUNT(CASE WHEN assigned_to IS NOT NULL THEN 1 END) as assigned,
    COUNT(CASE WHEN assigned_to IS NULL THEN 1 END) as unassigned
FROM leads
WHERE created_at >= CURRENT_DATE
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;

-- Query 3: Check what sources these leads came from
SELECT 
    source,
    COUNT(*) as count,
    COUNT(CASE WHEN assigned_to IS NULL THEN 1 END) as unassigned
FROM leads
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY source;

-- Query 4: Check if webhook inserted them or manual
-- (webhook usually sets source = 'facebook')
SELECT 
    source,
    status,
    COUNT(*) as count
FROM leads
WHERE created_at >= NOW() - INTERVAL '2 hours'
GROUP BY source, status
ORDER BY count DESC;

-- Query 5: Check eligible users for assignment
SELECT 
    u.name,
    u.email,
    u.team_code,
    u.is_active,
    u.total_leads_received,
    u.total_leads_promised,
    u.leads_today,
    CASE 
        WHEN NOT u.is_active THEN '❌ Inactive'
        WHEN u.total_leads_received >= u.total_leads_promised AND u.total_leads_promised > 0 THEN '❌ Quota Full'
        WHEN u.leads_today >= COALESCE(u.planned_daily_limit, 100) THEN '❌ Daily Limit'
        ELSE '✅ Eligible'
    END as assignment_status
FROM users u
WHERE u.team_code IN ('TEAMFIRE', 'TEAMRAJ', 'GJ01TEAMFIRE')
ORDER BY assignment_status, u.name;

-- Query 6: Count how many users are currently eligible
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active,
    COUNT(CASE WHEN 
        is_active = true 
        AND (total_leads_received < total_leads_promised OR total_leads_promised IS NULL OR total_leads_promised = 0)
        AND leads_today < COALESCE(planned_daily_limit, 100)
    THEN 1 END) as eligible_now
FROM users
WHERE team_code IN ('TEAMFIRE', 'TEAMRAJ', 'GJ01TEAMFIRE');
