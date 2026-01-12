-- ============================================================================
-- 🕵️‍♂️ FIND 'ALL INDIA' USERS
-- ============================================================================

-- Are there any active users who accept 'All India' leads?
SELECT 
    id,
    name, 
    plan_name, 
    leads_today, 
    daily_limit,
    (daily_limit - leads_today) as remaining_limit,
    target_state,
    payment_status,
    is_active
FROM users 
WHERE target_state ILIKE '%India%' 
OR target_state ILIKE '%Any%'
ORDER BY leads_today DESC;

-- Also check users with 'Delhi' or 'Haryana' matches, since leads are failing there too.
SELECT 
    id,
    name,
    target_state,
    leads_today,
    daily_limit
FROM users
WHERE target_state IN ('Delhi', 'Haryana', 'Uttar Pradesh')
AND payment_status = 'active';
