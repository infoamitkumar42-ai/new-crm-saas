-- ============================================================================
-- 🕵️ ABSOLUTE FINAL REAL-TIME CHECK
-- ============================================================================

SELECT NOW() as current_db_time;

-- Recent leads from the last 15 minutes
SELECT 
    l.created_at, 
    l.source, 
    l.name, 
    l.status, 
    u.name as assigned_to_user
FROM leads l
LEFT JOIN users u ON l.user_id = u.id
WHERE l.created_at > (NOW() - INTERVAL '15 minutes')
ORDER BY l.created_at DESC;
