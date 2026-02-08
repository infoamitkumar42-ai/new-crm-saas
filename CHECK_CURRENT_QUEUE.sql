-- ============================================================================
-- 🕵️ AUDIT NEW/UNASSIGNED LEADS (LAST 2 HOURS)
-- ============================================================================
-- Focuses on leads that arrived RECENTLY and their current status.

-- 1. Summary of statuses for leads created in the last 2 hours
SELECT 
    status, 
    COUNT(*) as count
FROM leads 
WHERE created_at > (NOW() - INTERVAL '2 hours')
GROUP BY status;

-- 2. Details of UNASSIGNED leads (New or Queued) from the last 2 hours
SELECT 
    created_at, 
    source, 
    name, 
    phone, 
    status,
    notes
FROM leads 
WHERE created_at > (NOW() - INTERVAL '2 hours')
  AND status NOT IN ('Assigned', 'Closed', 'Converted')
ORDER BY created_at DESC;

-- 3. Check for any "Queued" leads from ALL TIME (just in case)
SELECT 
    COUNT(*) as total_queued_all_time
FROM leads 
WHERE status = 'Queued';
