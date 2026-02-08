-- ============================================================================
-- 🕵️ REAL-TIME LOG FILTER (POST-FIX)
-- ============================================================================
-- Checks for any activity in the last 15 minutes only.
-- This filters out all the "old" errors from earlier this morning.

SELECT NOW() as current_db_time;

-- 1. Recent Leads (Last 15m)
SELECT 
    created_at, 
    source, 
    status, 
    assigned_to
FROM leads 
WHERE created_at > (NOW() - INTERVAL '15 minutes')
ORDER BY created_at DESC;

-- 2. Recent Errors (Last 15m)
SELECT 
    created_at, 
    error_type, 
    details->>'error' as error_detail
FROM webhook_errors
WHERE created_at > (NOW() - INTERVAL '15 minutes')
ORDER BY created_at DESC;
