-- ============================================================================
-- 🕵️ FINAL HEALTH CHECK - FEB 7 (10:10 AM)
-- ============================================================================

-- 1. Check for any very recent leads
SELECT 
    created_at, 
    source, 
    status, 
    assigned_to,
    notes
FROM leads 
WHERE created_at > (NOW() - INTERVAL '1 hour')
ORDER BY created_at DESC;

-- 2. Check for recent webhook errors
SELECT 
    created_at, 
    error_type, 
    details->>'error' as error_detail,
    details->>'page_id' as page_id,
    details->>'source' as source
FROM webhook_errors
WHERE created_at > (NOW() - INTERVAL '2 hours')
ORDER BY created_at DESC;
