-- 1. List ALL 16+ Leads generated today to see where they went
SELECT 
    l.id,
    l.name as Lead_Name,
    l.phone,
    l.source as Source_Name,
    l.created_at,
    l.status,
    l.assigned_to,
    COALESCE(u.name, '⚠️ UNASSIGNED') as Assigned_User,
    u.manager_id,
    (SELECT name FROM users WHERE id = u.manager_id) as Manager_Name
FROM leads l
LEFT JOIN users u ON l.assigned_to = u.id
WHERE l.created_at >= CURRENT_DATE
ORDER BY l.created_at DESC;

-- 2. Summary: Who got leads today?
SELECT 
    COALESCE(u.name, '⚠️ UNASSIGNED') as User_Name,
    l.source,
    COUNT(*) as Total_Leads
FROM leads l
LEFT JOIN users u ON l.assigned_to = u.id
WHERE l.created_at >= CURRENT_DATE
GROUP BY u.name, l.source
ORDER BY Total_Leads DESC;
