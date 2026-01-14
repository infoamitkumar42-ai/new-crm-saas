-- ============================================================================
-- 📊 LEAD DEMAND ANALYSIS (Target: 3:00 PM)
-- ============================================================================

WITH UserStats AS (
    SELECT 
        COUNT(*) as active_users_count,
        SUM(daily_limit) as total_daily_capacity,
        SUM(leads_today) as leads_delivered_so_far
    FROM users 
    WHERE is_active = true
)
SELECT 
    active_users_count,
    total_daily_capacity,
    leads_delivered_so_far,
    (total_daily_capacity - leads_delivered_so_far) as remaining_leads_needed,
    
    -- Time Calculations (assuming Current Time is ~8:00 AM)
    -- Target: 3:00 PM = 15:00 hours
    -- Remaining Hours approx 7 hours
    ROUND(
        (total_daily_capacity - leads_delivered_so_far)::numeric / 7.0, 
        1
    ) as leads_per_hour_needed_7hr,
    
    NOW() as current_db_time
FROM UserStats;

-- Detailed Breakdown by Plan
SELECT 
    plan_name,
    COUNT(*) as user_count,
    SUM(daily_limit) as total_cap,
    SUM(leads_today) as delivered,
    SUM(daily_limit - leads_today) as pending
FROM users
WHERE is_active = true
GROUP BY plan_name
ORDER BY pending DESC;
