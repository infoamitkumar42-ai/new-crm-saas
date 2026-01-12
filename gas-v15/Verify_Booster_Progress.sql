-- ============================================================================
-- VERIFY: BOOSTER PROGRESS AFTER NAME FIX
-- ============================================================================

SELECT 
    u.name, 
    u.email, 
    u.leads_today, 
    u.daily_limit,
    us.plan_name as current_priority
FROM users u
JOIN users_subscription us ON u.id = us.user_id
WHERE u.email IN (
    'bangersonia474@gmail.com', 'sumansumankaur09@gmail.com', 
    'diljots027@gmail.com', 'muskanchopra376@gmail.com', 
    'jerryvibes.444@gmail.com', 'rajbinderkamboj123@gmail.com', 
    'knavjotkaur113@gmail.com', 'singhmanbir938@gmail.com', 
    'rasganiya98775@gmail.com'
)
ORDER BY u.leads_today DESC;

-- Check remaining 'New' leads for today
SELECT COUNT(*) FROM leads WHERE status = 'New' AND created_at >= '2026-01-09 06:30:00'::timestamptz;
