-- ============================================================================
-- 📊 MANAGER & WEEKLY BOOST: RECEIVED COUNTS
-- ============================================================================

SELECT 
    u.name, 
    u.plan_name, 
    COUNT(l.id) as leads_today
FROM users u
JOIN leads l ON u.id = l.user_id
WHERE (u.plan_name ILIKE '%manager%' OR u.plan_name ILIKE '%weekly%')
  AND l.assigned_at >= NOW() - INTERVAL '4 hours'
GROUP BY u.name, u.plan_name
ORDER BY leads_today DESC;
