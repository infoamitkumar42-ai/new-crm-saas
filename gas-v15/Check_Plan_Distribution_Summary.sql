-- ============================================================================
-- 📊 PLAN DISTRIBUTION SUMMARY (Since 8:00 AM)
-- ============================================================================

SELECT 
    u.plan_name,
    COUNT(l.id) as leads_count,
    STRING_AGG(DISTINCT u.name, ', ') as users_list
FROM leads l
JOIN users u ON l.user_id = u.id
WHERE l.assigned_at >= CURRENT_DATE + TIME '08:00:00'
GROUP BY u.plan_name
ORDER BY leads_count DESC;

-- Total Summary
SELECT count(*) as total_distributed_today 
FROM leads 
WHERE assigned_at >= CURRENT_DATE + TIME '08:00:00';
