-- ============================================================================
-- 📊 LATEST LEAD ASSIGNMENTS REPORT (REAL-TIME)
-- ============================================================================

-- 1. Total Unique Leads Today (Clean Count)
SELECT 
    COUNT(*) as total_clean_leads_today
FROM leads 
WHERE created_at >= CURRENT_DATE;

-- 2. Latest 10 Assigned Leads
SELECT 
    l.created_at, 
    l.source, 
    l.name as lead_name,
    u.name as assigned_to_user,
    l.status
FROM leads l
LEFT JOIN users u ON l.user_id = u.id
WHERE l.created_at >= CURRENT_DATE
ORDER BY l.created_at DESC
LIMIT 10;

-- 3. Today's Distribution (Leads per User)
-- Helps verify fairness/round-robin
SELECT 
    u.name as user_name,
    COUNT(l.id) as leads_received_today
FROM users u
LEFT JOIN leads l ON (u.id = l.user_id AND l.created_at >= CURRENT_DATE)
WHERE u.is_active = true 
  AND u.plan_name != 'none'
GROUP BY u.name
HAVING COUNT(l.id) > 0
ORDER BY leads_received_today DESC;
