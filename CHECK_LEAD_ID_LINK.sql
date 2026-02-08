-- ============================================================================
-- 🕵️ CHECK LEAD ASSIGNMENT COLUMNS
-- ============================================================================
-- Checks exactly what is stored in the lead assignment columns.

SELECT 
    l.name as lead_name,
    l.status,
    l.user_id,
    l.assigned_to,
    (SELECT name FROM users u WHERE u.id::text = l.user_id::text) as name_via_user_id,
    (SELECT name FROM users u WHERE u.id::text = l.assigned_to::text) as name_via_assigned_to
FROM leads l 
WHERE l.status = 'Assigned' 
  AND l.created_at >= CURRENT_DATE
ORDER BY l.created_at DESC 
LIMIT 10;
