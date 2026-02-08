-- ============================================================================
-- 🕵️ CHECK NOTIFICATIONS TABLE
-- ============================================================================

-- Check if any notifications were created in the last 15 minutes
SELECT 
    id,
    created_at,
    user_id,
    title,
    body,
    is_read
FROM notifications
WHERE created_at >= NOW() - INTERVAL '15 minutes'
ORDER BY created_at DESC;

-- Also check if 'users' table has a 'last_notification_at' column or similar
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name LIKE '%notif%';
