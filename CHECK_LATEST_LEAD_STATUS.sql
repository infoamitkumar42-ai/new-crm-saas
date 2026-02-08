-- ============================================================================
-- 🕵️ CHECK LATEST LEAD (The <1 min ago one)
-- ============================================================================

SELECT 
    l.id,
    l.name,
    l.phone,
    l.created_at,
    l.assigned_to,
    u.name as assigned_user,
    l.status,
    l.notes
FROM leads l
LEFT JOIN users u ON l.assigned_to = u.id
ORDER BY l.created_at DESC
LIMIT 1;

-- Also check Webhook Errors for this lead (just in case)
SELECT * FROM webhook_errors 
WHERE created_at >= NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;
