-- VERIFY: Recent leads (15-17 Jan) assigned correctly to users

-- 1. Check if any orphans still exist (should be 0)
SELECT 
    'Orphan Leads (15-17 Jan)' as Check_Type,
    COUNT(*) as Count
FROM leads 
WHERE status = 'Assigned' 
AND assigned_to IS NULL
AND created_at >= '2026-01-15 00:00:00';

-- 2. User-wise breakdown: Who got how many leads from 15-17 Jan
SELECT 
    u.name as User_Name,
    u.email,
    COUNT(l.id) as Leads_15_to_17_Jan,
    u.leads_today as Dashboard_Counter
FROM users u
LEFT JOIN leads l ON l.assigned_to = u.id 
    AND l.created_at >= '2026-01-15 00:00:00'
    AND l.status = 'Assigned'
WHERE u.is_active = true
GROUP BY u.name, u.email, u.leads_today
HAVING COUNT(l.id) > 0
ORDER BY Leads_15_to_17_Jan DESC;

-- 3. Quick summary
SELECT 
    'Total Leads Assigned (15-17 Jan)' as Metric,
    COUNT(*) as Value
FROM leads 
WHERE assigned_to IS NOT NULL 
AND status = 'Assigned'
AND created_at >= '2026-01-15 00:00:00'

UNION ALL

SELECT 
    'Users with Leads' as Metric,
    COUNT(DISTINCT assigned_to) as Value
FROM leads 
WHERE assigned_to IS NOT NULL 
AND status = 'Assigned'
AND created_at >= '2026-01-15 00:00:00';
