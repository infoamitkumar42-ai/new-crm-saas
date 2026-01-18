-- STEP 1: Find 8 unassigned leads for Rajni & Gurnam
SELECT id, name, phone, city, status, created_at
FROM leads 
WHERE 
    assigned_to IS NULL 
    AND status IN ('New', 'Night_Backlog')
    AND is_valid_phone = true
    AND created_at >= '2026-01-15 00:00:00'
ORDER BY created_at DESC
LIMIT 8;

-- STEP 2: Assign first 4 to Rajni
UPDATE leads SET 
    assigned_to = (SELECT id FROM users WHERE email = 'rajnikaler01@gmail.com'),
    user_id = (SELECT id FROM users WHERE email = 'rajnikaler01@gmail.com'),
    status = 'Assigned',
    assigned_at = NOW()
WHERE id IN (
    SELECT id FROM leads 
    WHERE assigned_to IS NULL 
    AND status IN ('New', 'Night_Backlog')
    AND is_valid_phone = true
    AND created_at >= '2026-01-15 00:00:00'
    ORDER BY created_at DESC
    LIMIT 4
);

-- STEP 3: Assign next 4 to Gurnam
UPDATE leads SET 
    assigned_to = (SELECT id FROM users WHERE email = 'gurnambal01@gmail.com'),
    user_id = (SELECT id FROM users WHERE email = 'gurnambal01@gmail.com'),
    status = 'Assigned',
    assigned_at = NOW()
WHERE id IN (
    SELECT id FROM leads 
    WHERE assigned_to IS NULL 
    AND status IN ('New', 'Night_Backlog')
    AND is_valid_phone = true
    AND created_at >= '2026-01-15 00:00:00'
    ORDER BY created_at DESC
    LIMIT 4
);

-- STEP 4: Update their leads_today counters
UPDATE users SET leads_today = COALESCE(leads_today, 0) + 4 WHERE email = 'rajnikaler01@gmail.com';
UPDATE users SET leads_today = COALESCE(leads_today, 0) + 4 WHERE email = 'gurnambal01@gmail.com';

-- STEP 5: Verify
SELECT 
    u.name as User_Name,
    u.email,
    u.leads_today,
    COUNT(l.id) as new_leads_assigned
FROM users u
LEFT JOIN leads l ON l.assigned_to = u.id AND l.assigned_at >= NOW() - INTERVAL '5 minutes'
WHERE u.email IN ('rajnikaler01@gmail.com', 'gurnambal01@gmail.com')
GROUP BY u.name, u.email, u.leads_today;
