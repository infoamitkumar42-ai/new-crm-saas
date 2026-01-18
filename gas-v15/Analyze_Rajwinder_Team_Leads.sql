-- Analysis for Manager: RAJWINDER
-- ID: 1f4ab7b6-583d-4db8-9866-fbef457eea98

-- 1. List all Team Members
SELECT id, name, email, role, payment_status, is_active
FROM users
WHERE manager_id = '1f4ab7b6-583d-4db8-9866-fbef457eea98'
OR id = '1f4ab7b6-583d-4db8-9866-fbef457eea98';

-- 2. Lead Count Breakdown (Today vs Total)
SELECT 
    u.name as User_Name,
    COUNT(CASE WHEN l.created_at >= CURRENT_DATE THEN 1 END) as Leads_Today,
    COUNT(l.id) as Lifetime_Leads,
    MAX(l.created_at) as Last_Lead_Time
FROM users u
LEFT JOIN leads l ON u.id = l.assigned_to
WHERE 
    u.manager_id = '1f4ab7b6-583d-4db8-9866-fbef457eea98' 
    OR u.id = '1f4ab7b6-583d-4db8-9866-fbef457eea98'
GROUP BY u.name
ORDER BY Leads_Today DESC;

-- 3. Last 20 Leads Details
SELECT 
    l.name as Lead_Name,
    l.phone,
    l.created_at,
    u.name as Assigned_To
FROM leads l
JOIN users u ON l.assigned_to = u.id
WHERE 
    u.manager_id = '1f4ab7b6-583d-4db8-9866-fbef457eea98' 
    OR u.id = '1f4ab7b6-583d-4db8-9866-fbef457eea98'
ORDER BY l.created_at DESC
LIMIT 20;
