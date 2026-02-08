-- ============================================================================
-- 🔍 CHECK UNASSIGNED LEADS STATUS
-- ============================================================================

-- Query 1: Status breakdown of unassigned leads
SELECT 
    status,
    source,
    COUNT(*) as count,
    MIN(created_at) as earliest_time,
    MAX(created_at) as latest_time
FROM leads
WHERE created_at >= CURRENT_DATE
  AND assigned_to IS NULL
GROUP BY status, source
ORDER BY count DESC;

-- Query 2: Sample unassigned leads
SELECT 
    id,
    name,
    phone,
    status,
    source,
    created_at
FROM leads
WHERE created_at >= CURRENT_DATE
  AND assigned_to IS NULL
ORDER BY created_at DESC
LIMIT 10;
