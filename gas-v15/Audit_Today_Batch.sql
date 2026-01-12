-- ============================================================================
-- 🔍 AUDIT: WHERE ARE TODAY'S 441 LEADS?
-- ============================================================================
-- This script only READS data.

-- 1. Check exact status of leads created today (Since 12 PM IST / 6:30 AM UTC)
SELECT 
    status, 
    COUNT(*) as count,
    MIN(created_at) at time zone 'Asia/Kolkata' as oldest,
    MAX(created_at) at time zone 'Asia/Kolkata' as newest
FROM leads 
WHERE created_at >= '2026-01-09 06:30:00'::timestamptz
GROUP BY 1;

-- 2. Verify if these leads have ANY user assigned
SELECT 
    user_id IS NULL as is_unassigned,
    status,
    COUNT(*)
FROM leads 
WHERE created_at >= '2026-01-09 06:30:00'::timestamptz
GROUP BY 1, 2;

-- 3. Check specific prioritized users in BOTH tables
SELECT 
    u.name, 
    u.email, 
    u.leads_today as users_table_count,
    us.leads_sent as subscription_table_count,
    us.plan_name as active_priority,
    u.is_active,
    u.payment_status
FROM users u
JOIN users_subscription us ON u.id = us.user_id
WHERE u.email IN (
    'bangersonia474@gmail.com', 'sumansumankaur09@gmail.com', 
    'diljots027@gmail.com', 'muskanchopra376@gmail.com', 
    'jerryvibes.444@gmail.com', 'rajbinderkamboj123@gmail.com', 
    'knavjotkaur113@gmail.com', 'singhmanbir938@gmail.com', 
    'rasganiya98775@gmail.com'
);
