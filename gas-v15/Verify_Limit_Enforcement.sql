-- ============================================================================
-- 🛡️ LIMIT ENFORCEMENT VERIFICATION
-- ============================================================================

-- 1. Check for any usage breaches
SELECT 
    name, 
    email, 
    leads_today, 
    daily_limit,
    (leads_today - daily_limit) as over_limit_by
FROM users 
WHERE leads_today > daily_limit;

-- 2. Check assignments in the last 15 minutes (Post-Fix)
SELECT 
    l.id,
    l.assigned_at,
    u.name as assigned_to,
    u.leads_today,
    u.daily_limit
FROM leads l
JOIN users u ON l.user_id = u.id
WHERE l.assigned_at > NOW() - INTERVAL '15 minutes'
AND u.leads_today > u.daily_limit;
