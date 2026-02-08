-- ============================================================================
-- 🔍 INVESTIGATE RPC ERROR ROOT CAUSE
-- ============================================================================

-- 1. Check the 6 queued leads - what team codes do they have?
SELECT 
    l.id,
    l.name,
    l.source,
    l.created_at,
    l.notes,
    mp.team_id
FROM leads l
LEFT JOIN meta_pages mp ON l.source LIKE '%' || mp.page_name || '%'
WHERE l.status = 'Queued'
  AND l.created_at >= NOW() - INTERVAL '30 minutes'
ORDER BY l.created_at DESC;

-- 2. Check if team_code exists for these teams
SELECT DISTINCT team_code, COUNT(*) as user_count
FROM users 
WHERE is_active = true
GROUP BY team_code;

-- 3. Check if any eligible users exist for the failing team
SELECT 
    team_code,
    COUNT(*) as total_users,
    COUNT(CASE WHEN is_active = true AND is_online = true THEN 1 END) as available_users,
    COUNT(CASE WHEN leads_today < daily_limit THEN 1 END) as users_under_limit
FROM users
GROUP BY team_code;
