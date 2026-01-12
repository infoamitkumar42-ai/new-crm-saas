-- ============================================================================
-- DETAILED STUCK LEADS & USER DISTRIBUTION ANALYSIS
-- ============================================================================

-- 1. STUCK LEADS AGE ANALYSIS
-- Who are these 158 leads and when were they created/assigned?
SELECT 
    status,
    COUNT(*) as count,
    MIN(created_at) as oldest_created,
    MAX(created_at) as newest_created,
    MIN(assigned_at) as oldest_assigned,
    MAX(assigned_at) as newest_assigned
FROM leads 
WHERE status = 'Assigned' 
  AND assigned_at < NOW() - INTERVAL '1 day'
GROUP BY status;

-- 2. STUCK LEADS BY USER (Is one person holding many?)
SELECT 
    u.name,
    u.email,
    COUNT(l.id) as stuck_leads_count
FROM leads l
JOIN users u ON l.user_id = u.id
WHERE l.status = 'Assigned' 
  AND l.assigned_at < NOW() - INTERVAL '1 day'
GROUP BY u.name, u.email
ORDER BY stuck_leads_count DESC
LIMIT 10;

-- 3. DETAILED PER-USER DISTRIBUTION VS PLAN QUOTA (Today)
-- Shows all 61+ active members and their current progress
SELECT 
    u.name,
    u.email,
    u.plan_name,
    u.daily_limit as plan_quota,
    COUNT(l.id) as actual_leads_assigned_today,
    ROUND((COUNT(l.id)::numeric / NULLIF(u.daily_limit, 0)::numeric) * 100, 1) as percentage_completed,
    u.payment_status,
    u.is_active
FROM users u
LEFT JOIN leads l ON l.user_id = u.id AND l.assigned_at >= CURRENT_DATE
WHERE u.role = 'member'
GROUP BY u.id, u.name, u.email, u.plan_name, u.daily_limit, u.payment_status, u.is_active
HAVING u.is_active = true OR COUNT(l.id) > 0
ORDER BY percentage_completed DESC, actual_leads_assigned_today DESC;

-- 4. PENDING BACKLOG AGE (When were the 205+ pending leads born?)
SELECT 
    DATE_TRUNC('hour', created_at) as hour_created,
    COUNT(*) as lead_count
FROM leads 
WHERE status = 'New' AND user_id IS NULL
GROUP BY 1
ORDER BY 1 DESC;
