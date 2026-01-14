-- ============================================================================
-- 🕵️ CHECK AUTO-DISTRIBUTION STATUS (Since 8:00 AM)
-- ============================================================================

-- 1. Summary of Today's Distribution (by Source)
SELECT 
    source,
    COUNT(*) as count,
    MIN(assigned_at) as first_lead_time,
    MAX(assigned_at) as last_lead_time
FROM leads
WHERE assigned_at >= CURRENT_DATE + TIME '08:00:00'
GROUP BY source;

-- 2. Recent 10 Assignments (Any Source)
SELECT 
    l.id, 
    l.name as lead_name, 
    u.name as assigned_to, 
    l.assigned_at, 
    l.source,
    u.plan_name
FROM leads l
JOIN users u ON l.user_id = u.id
WHERE l.assigned_at >= CURRENT_DATE + TIME '08:00:00'
ORDER BY l.assigned_at DESC
LIMIT 10;

-- 3. Check System Time
SELECT NOW() as current_db_time;
