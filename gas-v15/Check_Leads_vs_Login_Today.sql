-- =====================================================
-- URGENT: Check who got leads today vs who logged in
-- Date: 2026-01-14
-- =====================================================

-- USERS WHO GOT LEADS TODAY - LOGIN STATUS CHECK
SELECT 
    u.id,
    u.name,
    u.plan_name,
    u.daily_limit,
    u.leads_today,
    u.last_activity,
    -- Check if logged in AFTER 8 AM today (working hours start)
    CASE 
        WHEN u.last_activity >= (CURRENT_DATE + INTERVAL '2 hours 30 minutes') THEN '✅ LOGGED IN (8AM+)'
        WHEN u.last_activity >= CURRENT_DATE THEN '⚠️ EARLY LOGIN (before 8AM)'
        ELSE '❌ NOT LOGGED IN TODAY'
    END as login_status,
    -- Count actual leads assigned today
    COUNT(l.id) as leads_received_today,
    -- First lead time
    MIN(l.assigned_at) as first_lead_time,
    -- Last lead time  
    MAX(l.assigned_at) as last_lead_time
FROM users u
JOIN leads l ON l.user_id = u.id 
    AND l.created_at >= CURRENT_DATE 
    AND l.status = 'Assigned'
GROUP BY u.id, u.name, u.plan_name, u.daily_limit, u.leads_today, u.last_activity
ORDER BY 
    -- NOT logged in first (these need attention)
    CASE WHEN u.last_activity >= CURRENT_DATE THEN 1 ELSE 0 END,
    COUNT(l.id) DESC;

-- ========== SUMMARY ==========
-- How many users logged in vs not logged in who got leads
SELECT 
    CASE 
        WHEN last_activity >= (CURRENT_DATE + INTERVAL '2 hours 30 minutes') THEN 'LOGGED IN (Working Hours)'
        WHEN last_activity >= CURRENT_DATE THEN 'EARLY LOGIN'
        ELSE 'NOT LOGGED IN TODAY'
    END as status,
    COUNT(DISTINCT u.id) as user_count,
    SUM(cnt.leads) as total_leads
FROM users u
JOIN (
    SELECT user_id, COUNT(*) as leads 
    FROM leads 
    WHERE created_at >= CURRENT_DATE AND status = 'Assigned' 
    GROUP BY user_id
) cnt ON cnt.user_id = u.id
GROUP BY 
    CASE 
        WHEN last_activity >= (CURRENT_DATE + INTERVAL '2 hours 30 minutes') THEN 'LOGGED IN (Working Hours)'
        WHEN last_activity >= CURRENT_DATE THEN 'EARLY LOGIN'
        ELSE 'NOT LOGGED IN TODAY'
    END
ORDER BY status;
