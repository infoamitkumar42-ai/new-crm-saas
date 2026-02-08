-- ============================================================================
-- 🕵️ POST-EXTENDED-TOKEN HEALTH CHECK
-- ============================================================================

-- 1. Check for any errors in the last 15 minutes
SELECT 
    created_at, 
    error_type, 
    details->>'error' as error_detail
FROM webhook_errors
WHERE created_at > (NOW() - INTERVAL '15 minutes')
ORDER BY created_at DESC;

-- 2. Confirm last 5 lead statuses
SELECT 
    created_at, 
    source, 
    status, 
    assigned_to
FROM leads 
ORDER BY created_at DESC 
LIMIT 5;
