-- ============================================================================
-- 🕵️ ANALYZE SUDDENLY ASSIGNED LEADS
-- ============================================================================

-- Query 1: Timeline of Creation for Force-Distributed Leads
SELECT 
    DATE(created_at) as lead_date,
    EXTRACT(HOUR FROM created_at) as lead_hour,
    source,
    COUNT(*) as count
FROM leads
WHERE notes LIKE '%Force Distributed%'
  AND assigned_at >= NOW() - INTERVAL '10 minutes' -- Assigned just now
GROUP BY 1, 2, 3
ORDER BY 1 DESC, 2 DESC;

-- Query 2: Sample of these leads
SELECT 
    id,
    name,
    phone,
    source,
    created_at,
    assigned_at,
    status
FROM leads
WHERE notes LIKE '%Force Distributed%'
ORDER BY created_at DESC
LIMIT 20;

-- Query 3: Check if they were stuck status before
-- (We can't confirm status before update easily, but we know filter was Night_Backlog/Queued)
-- Just confirming they are indeed Himanshu's
SELECT 
    source, 
    COUNT(*) 
FROM leads 
WHERE notes LIKE '%Force Distributed%'
GROUP BY 1;
