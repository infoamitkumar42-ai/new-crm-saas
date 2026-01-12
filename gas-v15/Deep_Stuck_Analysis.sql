-- ============================================================================
-- DEEP ANALYSIS OF 1534 STUCK LEADS
-- ============================================================================

-- 1. When were these 1534 leads assigned? (By Day)
SELECT 
    DATE_TRUNC('day', assigned_at) as assignment_day,
    COUNT(*) as lead_count
FROM leads 
WHERE status = 'Assigned'
GROUP BY 1
ORDER BY 1 DESC;

-- 2. Who is holding these leads? (Top 20 Managers)
SELECT 
    u.name,
    u.email,
    COUNT(l.id) as stuck_leads
FROM leads l
JOIN users u ON l.user_id = u.id
WHERE l.status = 'Assigned'
GROUP BY 1, 2
ORDER BY stuck_leads DESC
LIMIT 20;

-- 3. Check for specific status mix
SELECT 
    status, 
    COUNT(*) 
FROM leads 
GROUP BY status;
