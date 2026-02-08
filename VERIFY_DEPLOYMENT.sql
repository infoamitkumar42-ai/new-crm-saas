-- ============================================================================
-- 🕵️ VERIFY DEPLOYMENT (Checks for Post-Deploy Activity)
-- ============================================================================

-- 1. Check for NEW Errors (Created AFTER 03:55 UTC)
SELECT 
    created_at,
    error_type,
    details 
FROM webhook_errors 
WHERE created_at >= NOW() - INTERVAL '30 minutes'
ORDER BY created_at DESC;

-- 2. Check for NEW Successful Leads (Created AFTER 03:55 UTC)
SELECT 
    id,
    created_at,
    name,
    status,
    notes,
    assigned_to
FROM leads
WHERE created_at >= NOW() - INTERVAL '30 minutes'
ORDER BY created_at DESC;

-- 3. Just confirm exact time again
SELECT NOW() at time zone 'utc' as current_time_utc;
