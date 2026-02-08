-- ============================================================================
-- 🕵️ POST-FIX SUCCESS VERIFICATION
-- ============================================================================

SELECT NOW() as current_db_time;

-- 1. Success Count (Last 60m)
SELECT 
    status,
    COUNT(*) as count
FROM leads 
WHERE created_at > (NOW() - INTERVAL '60 minutes')
GROUP BY status;

-- 2. Error Count (Last 60m)
SELECT 
    error_type,
    COUNT(*) as count
FROM webhook_errors
WHERE created_at > (NOW() - INTERVAL '60 minutes')
GROUP BY error_type;

-- 3. The very last few leads to see their routing
SELECT 
    created_at, 
    source, 
    status, 
    assigned_to
FROM leads 
ORDER BY created_at DESC
LIMIT 5;
