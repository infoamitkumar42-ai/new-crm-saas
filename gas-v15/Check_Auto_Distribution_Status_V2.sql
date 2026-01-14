-- ============================================================================
-- 🕵️ CHECK DISTRIBUTION TODAY (Timezone Safe)
-- ============================================================================

-- Check all leads assigned in the last 2 hours (Since 6:15 AM IST approx)
SELECT 
    source,
    COUNT(*) as count,
    MIN(assigned_at) as first_lead_time,
    MAX(assigned_at) as last_lead_time
FROM leads
WHERE assigned_at > NOW() - INTERVAL '2 hours'
GROUP BY source;

-- List details to see if Realtime is working
SELECT 
    l.id, 
    l.name as lead_name, 
    u.name as assigned_to, 
    l.assigned_at, 
    l.source 
FROM leads l
JOIN users u ON l.user_id = u.id
WHERE l.assigned_at > NOW() - INTERVAL '2 hours'
ORDER BY l.assigned_at DESC
LIMIT 10;
