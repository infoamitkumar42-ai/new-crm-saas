-- ============================================================================
-- 📊 PLAN DISTRIBUTION SUMMARY (Breakdown Only)
-- ============================================================================

SELECT 
    u.plan_name,
    COUNT(l.id) as leads_assigned,
    STRING_AGG(DISTINCT u.name, ', ') as users_received
FROM leads l
JOIN users u ON l.user_id = u.id
WHERE l.assigned_at >= NOW() - INTERVAL '4 hours'
GROUP BY u.plan_name
ORDER BY leads_assigned DESC;
