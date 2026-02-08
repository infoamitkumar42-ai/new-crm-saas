-- ============================================================================
-- 📊 CHECK RECENT LEAD ACTIVITY
-- ============================================================================

-- Query 1: Today's leads summary
SELECT 
    COUNT(*) as total_today,
    COUNT(CASE WHEN assigned_to IS NOT NULL THEN 1 END) as assigned,
    COUNT(CASE WHEN assigned_to IS NULL THEN 1 END) as unassigned,
    MIN(created_at) as first_lead_time,
    MAX(created_at) as last_lead_time
FROM leads
WHERE created_at >= CURRENT_DATE;

-- Query 2: Today's leads by hour
SELECT 
    EXTRACT(HOUR FROM created_at) as hour,
    COUNT(*) as leads_count,
    COUNT(CASE WHEN assigned_to IS NOT NULL THEN 1 END) as assigned,
    COUNT(CASE WHEN assigned_to IS NULL THEN 1 END) as unassigned
FROM leads
WHERE created_at >= CURRENT_DATE
GROUP BY EXTRACT(HOUR FROM created_at)
ORDER BY hour DESC;

-- Query 3: Today's leads by user (top 10)
SELECT 
    u.name,
    u.email,
    COUNT(*) as leads_received_today,
    u.total_leads_received as total_all_time,
    u.total_leads_promised as quota
FROM leads l
JOIN users u ON l.assigned_to = u.id
WHERE l.created_at >= CURRENT_DATE
GROUP BY u.id, u.name, u.email, u.total_leads_received, u.total_leads_promised
ORDER BY leads_received_today DESC
LIMIT 10;

-- Query 4: Unassigned leads details (if any)
SELECT 
    id,
    name,
    phone,
    city,
    source,
    created_at,
    user_id,
    assigned_to
FROM leads
WHERE created_at >= CURRENT_DATE
  AND assigned_to IS NULL
ORDER BY created_at DESC;

-- Query 5: Last 20 leads with assignment details
SELECT 
    l.created_at,
    l.name as lead_name,
    l.phone,
    l.city,
    l.source,
    u.name as assigned_to_user,
    u.email,
    CASE 
        WHEN l.user_id IS NOT NULL AND l.assigned_to IS NOT NULL THEN '✅ Both columns'
        WHEN l.user_id IS NULL THEN '⚠️ Missing user_id'
        WHEN l.assigned_to IS NULL THEN '⚠️ Unassigned'
        ELSE '❓ Unknown'
    END as tracking_status
FROM leads l
LEFT JOIN users u ON l.assigned_to = u.id
ORDER BY l.created_at DESC
LIMIT 20;

-- Query 6: Assignment rate in last hour
SELECT 
    COUNT(*) as leads_last_hour,
    COUNT(CASE WHEN assigned_to IS NOT NULL THEN 1 END) as assigned,
    COUNT(CASE WHEN assigned_to IS NULL THEN 1 END) as unassigned,
    ROUND(100.0 * COUNT(CASE WHEN assigned_to IS NOT NULL THEN 1 END) / NULLIF(COUNT(*), 0), 2) as assignment_rate_percent
FROM leads
WHERE created_at >= NOW() - INTERVAL '1 hour';
