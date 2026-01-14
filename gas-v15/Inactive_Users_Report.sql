-- =====================================================
-- INACTIVE USERS REPORT (Non-plan users data)
-- Date: 2026-01-14
-- =====================================================

-- All users with plan_name = 'none' or NULL
SELECT 
    u.id,
    u.name,
    u.email,
    u.phone,
    u.plan_name,
    u.is_active,
    u.daily_limit,
    u.leads_today,
    u.last_activity,
    u.target_state,
    u.target_gender,
    CASE 
        WHEN u.last_activity >= CURRENT_DATE THEN 'Today'
        WHEN u.last_activity >= CURRENT_DATE - INTERVAL '1 day' THEN 'Yesterday'
        WHEN u.last_activity >= CURRENT_DATE - INTERVAL '7 days' THEN 'This Week'
        ELSE 'Inactive > 7 days'
    END as login_status,
    (SELECT COUNT(*) FROM leads l WHERE l.user_id = u.id AND l.created_at >= CURRENT_DATE) as leads_today_actual
FROM users u
WHERE u.plan_name = 'none' OR u.plan_name IS NULL
ORDER BY u.last_activity DESC NULLS LAST;
