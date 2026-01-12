-- ============================================================================
-- AUDIT: TODAY'S LEAD DISTRIBUTION (Focus: Jan 9, 2026 | Since 12:00 PM IST)
-- ============================================================================

-- Note: 12:00 PM IST = 06:30 AM UTC
-- We'll analyze lead distribution activity for today

-- 1. OVERALL STATUS OF LEADS CREATED TODAY (Since 12:00 PM IST)
SELECT 
    status, 
    COUNT(*) as lead_count,
    MIN(created_at) as oldest_today,
    MAX(created_at) as newest_today
FROM leads 
WHERE created_at >= '2026-01-09 06:30:00'::timestamptz
GROUP BY status;

-- 2. PER-USER DISTRIBUTION VS DAILY LIMIT (All active users)
-- Identifies who reached their limit and who exceeded it
SELECT 
    u.name,
    u.email,
    u.plan_name,
    u.daily_limit,
    COUNT(l.id) as actual_distributed_today,
    u.daily_limit - COUNT(l.id) as quota_left,
    CASE 
        WHEN COUNT(l.id) > u.daily_limit THEN '🔴 OVER-DELIVERED'
        WHEN COUNT(l.id) = u.daily_limit THEN '🔥 LIMIT REACHED'
        WHEN COUNT(l.id) > 0 THEN '⏳ IN PROGRESS'
        ELSE '❌ ZERO LEADS'
    END as distribution_status
FROM users u
LEFT JOIN leads l ON l.user_id = u.id AND l.assigned_at >= '2026-01-09 00:00:00'::timestamptz
WHERE u.role = 'member' 
  AND u.is_active = true 
  AND u.payment_status = 'active'
GROUP BY u.id, u.name, u.email, u.plan_name, u.daily_limit
ORDER BY actual_distributed_today DESC;

-- 3. SPECIFIC LIST OF OVER-DELIVERED USERS (Urgent Review)
SELECT 
    u.name, 
    u.email, 
    u.daily_limit, 
    COUNT(l.id) as distributed
FROM users u
JOIN leads l ON l.user_id = u.id AND l.assigned_at >= '2026-01-09 00:00:00'::timestamptz
WHERE u.role = 'member'
GROUP BY u.id, u.name, u.email, u.daily_limit
HAVING COUNT(l.id) > u.daily_limit
ORDER BY distributed DESC;
