-- Verification: Check if Rajni and Gurnam received their leads

SELECT 
    u.name as assigned_user,
    u.email,
    l.id as lead_id,
    l.name as lead_name,
    l.phone,
    l.city,
    l.status,
    l.assigned_at
FROM leads l
JOIN users u ON l.assigned_to = u.id
WHERE 
    u.email IN ('rajnikaler01@gmail.com', 'gurnambal01@gmail.com')
    AND l.created_at >= '2026-01-16 00:00:00'
ORDER BY u.email, l.assigned_at DESC;

-- Summary count
SELECT 
    u.name as assigned_user,
    u.email,
    COUNT(l.id) as total_leads_assigned
FROM leads l
JOIN users u ON l.assigned_to = u.id
WHERE 
    u.email IN ('rajnikaler01@gmail.com', 'gurnambal01@gmail.com')
    AND l.created_at >= '2026-01-16 00:00:00'
GROUP BY u.name, u.email;
