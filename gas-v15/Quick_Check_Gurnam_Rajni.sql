-- Quick Check: Did Rajni and Gurnam get ANY leads assigned at all?

SELECT 
    u.name,
    u.email,
    COUNT(l.id) as total_leads
FROM users u
LEFT JOIN leads l ON l.assigned_to = u.id OR l.user_id = u.id
WHERE u.email IN ('rajnikaler01@gmail.com', 'gurnambal01@gmail.com')
GROUP BY u.name, u.email;

-- Detailed check: Show all leads assigned to them (if any)
SELECT 
    u.name as user_name,
    u.email,
    l.id as lead_id,
    l.name as lead_name,
    l.phone,
    l.status,
    l.assigned_at,
    l.created_at
FROM users u
LEFT JOIN leads l ON (l.assigned_to = u.id OR l.user_id = u.id)
WHERE u.email IN ('rajnikaler01@gmail.com', 'gurnambal01@gmail.com')
ORDER BY u.email, l.assigned_at DESC NULLS LAST;
