-- DIAGNOSTIC: Why Rajni & Gurnam assignment failed?

-- Check 1: Are there ANY unassigned leads available?
SELECT 
    'Available Unassigned Leads' as Check_Type,
    COUNT(*) as Count
FROM leads 
WHERE assigned_to IS NULL 
AND status IN ('New', 'Night_Backlog')
AND is_valid_phone = true
AND created_at >= '2026-01-15 00:00:00';

-- Check 2: Do Rajni & Gurnam exist and are active?
SELECT 
    name, 
    email, 
    id,
    is_active,
    leads_today,
    daily_limit
FROM users 
WHERE email IN ('rajnikaler01@gmail.com', 'gurnambal01@gmail.com');

-- Check 3: What leads were assigned to them in last 10 minutes?
SELECT 
    u.name,
    COUNT(l.id) as recent_leads
FROM users u
LEFT JOIN leads l ON l.assigned_to = u.id AND l.assigned_at >= NOW() - INTERVAL '10 minutes'
WHERE u.email IN ('rajnikaler01@gmail.com', 'gurnambal01@gmail.com')
GROUP BY u.name;

-- Check 4: Show actual orphan leads (assigned_to NULL but status = Assigned)
SELECT 
    'Orphan Leads' as Issue_Type,
    COUNT(*) as Count
FROM leads 
WHERE status = 'Assigned' AND assigned_to IS NULL;
