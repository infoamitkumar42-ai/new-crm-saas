-- ============================================================================
-- PROJECT: LEAD AGE & STATUS AUDIT
-- ============================================================================

-- 1. Age breakdown of 'Assigned' and 'Fresh' leads
-- This will tell us if these 1534 leads are from today or last month
SELECT 
    status,
    DATE_TRUNC('day', created_at) as date_created,
    COUNT(*) as lead_count
FROM leads 
WHERE status IN ('Assigned', 'Fresh', 'New')
GROUP BY 1, 2
ORDER BY 2 DESC, 1;

-- 2. Total Summary of All 61 Active Users (Today's performance)
-- Shows how many users have finished their quota
SELECT 
    status as quota_status,
    COUNT(*) as user_count
FROM (
    SELECT 
        u.id,
        CASE 
            WHEN COUNT(l.id) >= u.daily_limit THEN 'Full'
            WHEN COUNT(l.id) > 0 THEN 'Partial'
            ELSE 'Zero'
        END as status
    FROM users u
    LEFT JOIN leads l ON l.user_id = u.id AND l.assigned_at >= CURRENT_DATE
    WHERE u.role = 'member' AND u.is_active = true AND u.payment_status = 'active'
    GROUP BY u.id, u.daily_limit
) sub
GROUP BY 1;

-- 3. Check for the oldest lead in 'Fresh'
SELECT MIN(created_at) as oldest_fresh_lead FROM leads WHERE status = 'Fresh';
