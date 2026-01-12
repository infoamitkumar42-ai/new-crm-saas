-- ============================================================================
-- 📊 SIMPLE STATUS REPORT
-- ============================================================================

-- 1. HOW MANY MEMBERS ARE IN EACH STATE?
SELECT 
    'Quota Full (Done)' as status,
    COUNT(*) as member_count
FROM users 
WHERE payment_status = 'active' AND is_active = true AND leads_today >= daily_limit

UNION ALL

SELECT 
    'Partial (Pending)' as status,
    COUNT(*) as member_count
FROM users 
WHERE payment_status = 'active' AND is_active = true AND leads_today > 0 AND leads_today < daily_limit

UNION ALL

SELECT 
    'Zero Leads (Starved)' as status,
    COUNT(*) as member_count
FROM users 
WHERE payment_status = 'active' AND is_active = true AND leads_today = 0;


-- 2. WHO HAS ZERO LEADS? (Exact Names)
SELECT 
    name, 
    plan_name, 
    target_state, 
    daily_limit
FROM users 
WHERE payment_status = 'active'
AND is_active = true
AND leads_today = 0;
