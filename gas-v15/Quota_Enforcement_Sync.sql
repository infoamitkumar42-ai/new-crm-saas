-- ============================================================================
-- 1. SEARCH: Active Users with ZERO leads today (Since 12:00 AM IST)
-- ============================================================================
SELECT 
    u.name,
    u.email,
    u.plan_name,
    u.daily_limit
FROM users u
LEFT JOIN leads l ON l.user_id = u.id AND l.assigned_at >= CURRENT_DATE
WHERE u.role = 'member' 
  AND u.is_active = true 
  AND u.payment_status = 'active'
GROUP BY u.id, u.name, u.email, u.plan_name, u.daily_limit
HAVING COUNT(l.id) = 0
ORDER BY u.daily_limit DESC;

-- ============================================================================
-- 2. ENFORCE: Sync Database Counters to STOP further leads for full users
-- ============================================================================
-- This updates the 'leads_today' column to match the actual number of leads 
-- in the leads table. This will make the distributor see they are FULL.

-- A. Update counts for everyone based on real assignments today
UPDATE users u
SET leads_today = (
    SELECT COUNT(*) FROM leads l 
    WHERE l.user_id = u.id AND l.assigned_at >= CURRENT_DATE
);

-- B. Verification of "Stop" Status
SELECT 
    name, 
    email, 
    daily_limit, 
    leads_today as synchronized_count,
    CASE 
        WHEN leads_today >= daily_limit THEN '🛑 STOPPED (Full)'
        ELSE '🟢 AVAILABLE'
    END as current_status
FROM users 
WHERE role = 'member' AND is_active = true AND payment_status = 'active'
ORDER BY leads_today DESC;
