-- ============================================================================
-- 🕵️ DEBUG "RPC Error" LEADS SOURCE
-- ============================================================================

SELECT 
    l.id,
    l.name,
    l.source,
    mp.page_name,
    mp.team_id,
    CASE 
        WHEN mp.page_name IS NOT NULL THEN '✅ MATCH' 
        ELSE '❌ NO MATCH' 
    END as match_status
FROM leads l
LEFT JOIN meta_pages mp ON TRIM(l.source) ILIKE 'Meta - ' || TRIM(mp.page_name)
WHERE l.notes LIKE '%RPC Error%' OR l.notes LIKE '%Atomic assign failed%';

-- Show all Meta Pages to see exact names
SELECT page_name, team_id FROM meta_pages;
