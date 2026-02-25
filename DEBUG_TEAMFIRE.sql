SELECT 
    u.name, 
    u.email, 
    u.is_active, 
    u.is_online, 
    u.daily_limit, 
    COALESCE(
        (SELECT COUNT(*) 
         FROM leads l 
         WHERE l.assigned_to = u.id 
         AND to_char(l.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') = to_char(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD')
        ), 
        0
    ) as leads_calc,
    u.total_leads_received as total_recv,
    u.total_leads_promised as total_prom
FROM users u 
WHERE u.team_code = 'TEAMFIRE';
