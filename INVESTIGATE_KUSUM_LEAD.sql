-- ============================================================================
-- 🕵️ INVESTIGATE LEAD NOTES - KUSUM PATEL
-- ============================================================================

SELECT 
    id, 
    name, 
    phone, 
    source, 
    notes, 
    created_at, 
    assigned_at,
    assigned_to
FROM leads 
WHERE name ILIKE '%Kusum Patel%'
   OR phone = '8053733785' -- Using one of the duplicate phones from earlier if name fails
LIMIT 5;
