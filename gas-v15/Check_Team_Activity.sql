-- Check Last Activity Time for Rajwinder's Team
-- Webhook requires login AFTER 8 AM IST today (which is approx 2:30 AM UTC)

SELECT 
    id, 
    name, 
    leads_today, 
    remaining_limit, 
    last_activity,
    CASE 
        WHEN last_activity >= (CURRENT_DATE + TIME '02:30:00') THEN '✅ ACTIVE'
        ELSE '❌ INACTIVE (Not logged in today)'
    END as status_check
FROM (
    SELECT 
        id, 
        name, 
        leads_today, 
        (daily_limit - leads_today) as remaining_limit,
        last_activity
    FROM users 
    WHERE manager_id = '1f4ab7b6-583d-4db8-9866-fbef457eea98'
) as team_data;
