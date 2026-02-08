-- ============================================================================
-- 🕵️ CHECK IF AUTOMATIC ASSIGNMENT IS WORKING
-- ============================================================================

-- Query 1: Are there any UNASSIGNED leads right now?
-- If this is 0, the system is clean.
SELECT 
    COUNT(*) as waiting_leads,
    STRING_AGG(source, ', ') as waiting_sources
FROM leads 
WHERE assigned_to IS NULL 
  AND created_at >= CURRENT_DATE;

-- Query 2: Did any NEW leads arrive after our fix?
-- (Check last 15 mins, EXCLUDE our manual fix)
SELECT 
    id, 
    name, 
    status, 
    assigned_at, 
    notes
FROM leads 
WHERE created_at >= NOW() - INTERVAL '30 minutes'
  AND notes NOT LIKE '%Force Distributed%'
ORDER BY created_at DESC;

-- Query 3: Who got the most recent auto-assigned lead?
SELECT 
    l.id,
    l.name,
    u.name as assigned_to_user,
    l.assigned_at
FROM leads l
JOIN users u ON l.assigned_to = u.id
WHERE l.notes NOT LIKE '%Force Distributed%'
ORDER BY l.assigned_at DESC
LIMIT 1;
