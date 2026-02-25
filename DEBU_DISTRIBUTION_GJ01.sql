-- DIAGNOSTIC SQL: Chirag's Team Lead Distribution (GJ01TEAMFIRE)
-- This query shows who is winning the "Rotation" and why Akshay/Milan are stuck.

WITH TeamStats AS (
    SELECT 
        u.id,
        u.name,
        u.email,
        u.is_online,
        u.is_active,
        u.daily_limit,
        u.total_leads_received,
        (
            SELECT count(*) 
            FROM leads l 
            WHERE l.assigned_to = u.id 
            AND l.assigned_at >= CURRENT_DATE
        ) as leads_today
    FROM users u
    WHERE u.team_code = 'GJ01TEAMFIRE'
    AND u.is_active = true
)
SELECT 
    name,
    email,
    is_online,
    daily_limit,
    leads_today,
    total_leads_received,
    -- Distribution Priority: 1. Least leads today, 2. Lower daily limit reached %, 3. Total Received (Global Balance)
    CASE 
        WHEN leads_today >= daily_limit AND daily_limit > 0 THEN '❌ LIMIT REACHED'
        WHEN NOT is_online THEN '💤 OFFLINE'
        ELSE '✅ ELIGIBLE'
    END as status_check,
    RANK() OVER (
        ORDER BY 
            (CASE WHEN leads_today >= daily_limit AND daily_limit > 0 THEN 1 ELSE 0 END),
            leads_today ASC,
            total_leads_received ASC,
            id ASC
    ) as queue_priority
FROM TeamStats
ORDER BY queue_priority ASC;
