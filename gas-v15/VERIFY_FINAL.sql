-- FINAL VERIFICATION: Rajwinder & Sandeep ke leads check karo

SELECT 
    u.name as User_Name,
    u.email,
    l.name as Lead_Name,
    l.phone,
    l.city,
    l.status,
    l.assigned_at
FROM leads l
JOIN users u ON l.assigned_to = u.id
WHERE u.email IN ('workwithrajwinder@gmail.com', 'sunnymehre451@gmail.com')
AND l.assigned_at >= NOW() - INTERVAL '10 minutes'
ORDER BY u.email, l.assigned_at DESC;
