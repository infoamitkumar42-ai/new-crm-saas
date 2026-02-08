-- ============================================================================
-- 🎯 FINAL SYSTEM STATUS CHECK
-- ============================================================================

-- Query 1: Are leads assigning NOW? (after 8 AM)
SELECT 
    COUNT(*) as total_today,
    COUNT(CASE WHEN assigned_to IS NOT NULL THEN 1 END) as assigned,
    COUNT(CASE WHEN assigned_to IS NULL THEN 1 END) as waiting,
    MAX(created_at) as latest_lead,
    MAX(CASE WHEN assigned_to IS NOT NULL THEN created_at END) as latest_assignment
FROM leads
WHERE created_at >= CURRENT_DATE;

-- Query 2: Recent assignments (in last 15 minutes)
SELECT 
    l.name,
    l.source,
    u.name as assigned_to_user,
    u.team_code,
    TO_CHAR(l.created_at, 'HH24:MI:SS') as lead_time,
    TO_CHAR(l.assigned_at, 'HH24:MI:SS') as assigned_time
FROM leads l
LEFT JOIN users u ON l.assigned_to = u.id
WHERE l.created_at >= NOW() - INTERVAL '15 minutes'
ORDER BY l.created_at DESC
LIMIT 10;

-- Query 3: Team-wise distribution today
SELECT 
    u.team_code,
    COUNT(*) as leads_assigned,
    COUNT(DISTINCT u.id) as users_receiving
FROM leads l
JOIN users u ON l.assigned_to = u.id
WHERE l.created_at >= CURRENT_DATE
GROUP BY u.team_code
ORDER BY leads_assigned DESC;
