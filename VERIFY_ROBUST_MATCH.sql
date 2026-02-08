-- ============================================================================
-- 🕵️ VERIFY ROBUST MATCH (Before Processing)
-- ============================================================================

-- Try to find matches using a more flexible approach
-- "Meta - Digital Chirag" should match "Digital Chirag"
SELECT 
    l.id,
    l.source,
    mp.page_name,
    mp.team_id,
    'Matched' as status
FROM leads l
JOIN meta_pages mp ON TRIM(l.source) ILIKE '%' || TRIM(mp.page_name) || '%'
WHERE l.status = 'Queued'
  AND (l.notes LIKE '%RPC Error%' OR l.notes LIKE '%Atomic assign failed%');
