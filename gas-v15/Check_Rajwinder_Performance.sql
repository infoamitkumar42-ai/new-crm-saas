-- 1. Find Rajwinder to get her ID and Team details
WITH rajwinder_info AS (
    SELECT id, name, email, role 
    FROM users 
    WHERE name ILIKE '%Rajwinder%' OR email ILIKE '%rajwinder%'
    LIMIT 1
),
-- 2. Find all team members managed by Rajwinder
team_members AS (
    SELECT id, name, email, manager_id
    FROM users
    WHERE manager_id = (SELECT id FROM rajwinder_info)
)
-- 3. Check leads assigned to Rajwinder (personal) OR her team members
SELECT 
    l.id as lead_id,
    l.name as lead_name,
    l.created_at,
    l.assigned_to,
    u.name as assigned_user_name,
    u.manager_id,
    m.name as manager_name
FROM leads l
LEFT JOIN users u ON l.assigned_to = u.id
LEFT JOIN users m ON u.manager_id = m.id
WHERE 
    -- Leads assigned to Rajwinder herself
    l.assigned_to = (SELECT id FROM rajwinder_info)
    OR 
    -- Leads assigned to her team members
    l.assigned_to IN (SELECT id FROM team_members)
ORDER BY l.created_at DESC
LIMIT 50;

-- 4. Summary count by user for today
WITH rajwinder_info AS (
    SELECT id FROM users WHERE name ILIKE '%Rajwinder%' OR email ILIKE '%rajwinder%' LIMIT 1
),
team_members AS (
    SELECT id, name FROM users WHERE manager_id = (SELECT id FROM rajwinder_info)
)
SELECT 
    u.name as user_name,
    COUNT(l.id) as leads_received_today
FROM leads l
JOIN users u ON l.assigned_to = u.id
WHERE 
    (u.manager_id = (SELECT id FROM rajwinder_info) OR u.id = (SELECT id FROM rajwinder_info))
    AND l.created_at > CURRENT_DATE
GROUP BY u.name
ORDER BY leads_received_today DESC;
