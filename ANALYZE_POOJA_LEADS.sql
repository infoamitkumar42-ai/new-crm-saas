-- ============================================================================
-- 🕵️ ANALYZE POOJA JOLLY'S LEADS
-- ============================================================================

-- 1. Check Pooja's profile
SELECT id, name, team_code, daily_limit, leads_today, total_leads_received 
FROM users 
WHERE name ILIKE '%Pooja%';

-- 2. Check team counts for today
SELECT 
    source, 
    COUNT(*) as lead_count 
FROM leads 
WHERE created_at >= CURRENT_DATE 
GROUP BY source;

-- 3. Check distribution within her team (TEAMRAJ?)
SELECT 
    u.name, 
    u.team_code, 
    COUNT(l.id) as leads_today
FROM users u
LEFT JOIN leads l ON (u.id = l.user_id AND l.created_at >= CURRENT_DATE)
WHERE u.team_code = (SELECT team_code FROM users WHERE name ILIKE '%Pooja%' LIMIT 1)
GROUP BY u.name, u.team_code
ORDER BY leads_today DESC;
