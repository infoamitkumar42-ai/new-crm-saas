-- ============================================================================
-- 🕵️ DETAILED DISTRIBUTION CHECK (Manager/Weekly & Zero-Lead Users)
-- ============================================================================

-- 1. Manager & Weekly Boost: Per User Count (Kisne kitni li?)
SELECT 
    u.name, 
    u.plan_name, 
    COUNT(l.id) as leads_received
FROM users u
JOIN leads l ON u.id = l.user_id
WHERE (u.plan_name ILIKE '%manager%' OR u.plan_name ILIKE '%weekly%')
  AND l.assigned_at >= NOW() - INTERVAL '4 hours'
GROUP BY u.name, u.plan_name
ORDER BY leads_received DESC;

-- 2. WHO MISSED OUT? (Active Users with ZERO leads today)
SELECT 
    u.name, 
    u.plan_name, 
    u.email
FROM users u
LEFT JOIN leads l ON u.id = l.user_id AND l.assigned_at >= NOW() - INTERVAL '4 hours'
WHERE u.is_active = true
GROUP BY u.id, u.name, u.plan_name, u.email
HAVING COUNT(l.id) = 0
ORDER BY u.plan_name;
