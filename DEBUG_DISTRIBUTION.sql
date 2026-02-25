-- DEBUG SCRIPT
SELECT 
    u.id,
    u.name,
    u.email,
    u.is_active,
    u.is_online,
    u.role,
    u.daily_limit,
    COALESCE(
        (SELECT COUNT(*) 
         FROM leads l 
         WHERE l.assigned_to = u.id 
         AND l.created_at::date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date),
        0
    ) AS leads_today_calculated
FROM users u
WHERE u.team_code = 'GJ01TEAMFIRE';
