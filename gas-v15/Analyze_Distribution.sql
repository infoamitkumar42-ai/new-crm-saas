-- ============================================================================
-- 🕵️‍♂️ DISTRIBUTION AUTOPSY (Why did one get 17 and others 0?)
-- ============================================================================

-- 1. Identify the Over-Limit User (The "17 Leads" Case)
SELECT 
    u.name, 
    u.plan_name, 
    u.leads_today as counter_value,
    COUNT(l.id) as actual_leads_count,
    SUM(CASE WHEN l.source = 'Manual' THEN 1 ELSE 0 END) as manual_leads,
    SUM(CASE WHEN l.source != 'Manual' THEN 1 ELSE 0 END) as system_leads
FROM users u
LEFT JOIN leads l ON l.user_id = u.id 
    AND (l.assigned_at AT TIME ZONE 'Asia/Kolkata')::date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date
GROUP BY u.id, u.name, u.plan_name, u.leads_today
HAVING COUNT(l.id) > 10
ORDER BY actual_leads_count DESC;

-- 2. Identify the Starved Supervisors (Active but 0 Leads)
SELECT 
    u.name, 
    u.email, 
    u.plan_name, 
    u.last_activity,
    u.payment_status,
    u.leads_today
FROM users u
WHERE u.plan_name = 'supervisor' 
AND u.leads_today = 0
AND u.payment_status = 'active'
-- Check if they were online recently (active in last 24h)
AND u.last_activity > NOW() - INTERVAL '24 hours';
