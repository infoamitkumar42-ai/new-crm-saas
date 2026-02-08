-- ============================================================================
-- 🕵️ CHECK DISTRIBUTION OF 26 LEADS (GJ01TEAMFIRE)
-- ============================================================================

-- Query 1: Who got the 26 leads?
SELECT 
    u.name,
    u.id,
    COUNT(l.id) as leads_assigned,
    STRING_AGG(CASE WHEN l.notes LIKE '%Force Distributed%' THEN '✅ Force' ELSE '❌ Auto' END, ', ') as assignment_types
FROM leads l
JOIN users u ON l.assigned_to = u.id
WHERE u.team_code = 'GJ01TEAMFIRE'
  AND l.assigned_at >= CURRENT_DATE
GROUP BY u.name, u.id
ORDER BY leads_assigned DESC;

-- Query 2: Why didn't others get any? (Check Capacity/Status of Team)
SELECT 
    name,
    email,
    is_active,
    is_online,
    role,
    leads_today,
    daily_limit,
    total_leads_received,
    total_leads_promised
FROM users
WHERE team_code = 'GJ01TEAMFIRE'
ORDER BY name;
