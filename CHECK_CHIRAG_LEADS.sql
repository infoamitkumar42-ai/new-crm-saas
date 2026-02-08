-- ============================================================================
-- 🕵️ CHECK CHIRAG LEADS (Breakdown)
-- ============================================================================

SELECT 
    l.source,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN l.assigned_to IS NOT NULL THEN 1 END) as assigned,
    COUNT(CASE WHEN l.assigned_to IS NULL THEN 1 END) as waiting,
    -- Notes Analysis
    COUNT(CASE WHEN l.notes LIKE '%Force Distributed%' THEN 1 END) as force_distributed,
    COUNT(CASE WHEN l.notes LIKE '%Atomic assign failed%' THEN 1 END) as auto_assign_failed,
    COUNT(CASE WHEN l.notes IS NULL OR l.notes NOT LIKE '%Force%' AND l.notes NOT LIKE '%Atomic%' THEN 1 END) as purely_automatic
FROM leads l
WHERE l.source ILIKE '%Chirag%'
  AND l.created_at >= CURRENT_DATE
GROUP BY l.source;

-- Also check DETAILS of recent auto-assign attempts (Last 10)
SELECT 
    id,
    created_at,
    name,
    status,
    assigned_to,
    (SELECT name FROM users WHERE id = assigned_to) as assigned_user,
    notes
FROM leads
WHERE source ILIKE '%Chirag%'
  AND created_at >= CURRENT_DATE
ORDER BY created_at DESC
LIMIT 10;
