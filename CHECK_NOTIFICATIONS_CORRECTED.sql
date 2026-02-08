-- ============================================================================
-- 🕵️ CHECK NOTIFICATIONS TABLE
-- ============================================================================

-- Check if any notifications were created in the last 15 minutes
SELECT 
    id,
    created_at,
    user_id,
    title,
    message,
    is_read
FROM notifications
WHERE created_at >= NOW() - INTERVAL '15 minutes'
ORDER BY created_at DESC;
