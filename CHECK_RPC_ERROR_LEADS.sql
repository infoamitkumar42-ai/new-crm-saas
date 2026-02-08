-- ============================================================================
-- 🕵️ CHECK LEADS WITH RPC ERROR
-- ============================================================================

SELECT 
    id,
    created_at,
    name,
    status,
    assigned_to,
    notes
FROM leads
WHERE notes LIKE '%RPC Error%'
   OR notes LIKE '%Atomic assign failed%';

-- Summary Count
SELECT 
    status,
    COUNT(*) 
FROM leads 
WHERE notes LIKE '%RPC Error%'
   OR notes LIKE '%Atomic assign failed%'
GROUP BY status;
