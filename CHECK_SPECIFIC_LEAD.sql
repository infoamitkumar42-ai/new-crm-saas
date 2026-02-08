-- ============================================================================
-- 🕵️ CHECK SPECIFIC LEAD (BrijRaj Patel)
-- ============================================================================

SELECT 
    id,
    name,
    phone,
    source,
    status,
    assigned_to,
    (SELECT name FROM users WHERE id = assigned_to) as assigned_to_name,
    created_at,
    assigned_at,
    notes,
    user_id, -- Check Dashboard Visibility
    CASE 
        WHEN id::text = 'abc4a043-dd89-4f61-b7e6-e3a1fc9ad6d0' THEN '✅ Matches ID'
        ELSE '❌ Unknown ID'
    END as id_check
FROM leads 
WHERE id = 'abc4a043-dd89-4f61-b7e6-e3a1fc9ad6d0';

-- Also check last 5 leads again, just in case
SELECT 
    id,
    name,
    source,
    created_at,
    assigned_to,
    assigned_at,
    notes
FROM leads
ORDER BY created_at DESC
LIMIT 5;
