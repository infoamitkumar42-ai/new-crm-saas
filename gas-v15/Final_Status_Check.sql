-- ============================================================================
-- FINAL STATUS CHECK: TODAY'S LEADS (Jan 9)
-- ============================================================================

-- 1. How many leads from today are still NOT assigned?
SELECT 
    status, 
    COUNT(*) as lead_count
FROM leads 
WHERE created_at >= '2026-01-09 00:00:00'::timestamptz
  AND created_at < '2026-01-10 00:00:00'::timestamptz
GROUP BY status;

-- 2. Check the 10 "Booster" prioritized users status
-- (See if they are getting leads now)
SELECT 
    u.name, 
    u.email, 
    u.leads_today, 
    u.daily_limit
FROM users u
WHERE u.email IN (
    'bangersonia474@gmail.com', 'sumansumankaur09@gmail.com', 
    'diljots027@gmail.com', 'muskanchopra376@gmail.com', 
    'jerryvibes.444@gmail.com', 'rajbinderkamboj123@gmail.com', 
    'knavjotkaur113@gmail.com', 'singhmanbir938@gmail.com', 
    'rasganiya98775@gmail.com'
);
