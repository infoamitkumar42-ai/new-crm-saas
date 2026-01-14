-- ============================================================================
-- 📊 COMPLETE DAILY DISTRIBUTION REPORT
-- ============================================================================

-- 1. SUMMARY: Users who hit daily quota vs pending
SELECT 
    'QUOTA FULL' as status,
    COUNT(*) as users
FROM users 
WHERE is_active = true AND plan_name != 'none' AND leads_today >= daily_limit
UNION ALL
SELECT 
    'PENDING (Can receive more)' as status,
    COUNT(*) as users
FROM users 
WHERE is_active = true AND plan_name != 'none' AND leads_today < daily_limit AND daily_limit > 0;

-- ============================================================================
-- 2. USERS WITH FULL QUOTA (Daily Limit Hit)
-- ============================================================================
SELECT 
    '✅ QUOTA FULL' as status,
    name,
    plan_name,
    leads_today,
    daily_limit,
    target_state
FROM users 
WHERE is_active = true 
  AND plan_name != 'none' 
  AND leads_today >= daily_limit
ORDER BY leads_today DESC;

-- ============================================================================
-- 3. USERS WITH 0 LEADS (Why?)
-- ============================================================================
SELECT 
    '❌ ZERO LEADS' as status,
    name,
    plan_name,
    leads_today,
    daily_limit,
    target_state,
    target_gender,
    CASE 
        WHEN target_state NOT IN ('Punjab', 'All India', 'Chandigarh', 'Haryana') 
        THEN 'No leads from ' || target_state || ' today'
        WHEN target_gender = 'Female' 
        THEN 'Waiting for Female leads from ' || target_state
        ELSE 'Should be receiving leads'
    END as possible_reason
FROM users 
WHERE is_active = true 
  AND plan_name != 'none' 
  AND daily_limit > 0
  AND leads_today = 0
ORDER BY target_state;

-- ============================================================================
-- 4. USERS BELOW 50% QUOTA (Needs More Leads)
-- ============================================================================
SELECT 
    '⚠️ BELOW 50%' as status,
    name,
    plan_name,
    leads_today,
    daily_limit,
    target_state,
    ROUND((leads_today::decimal / daily_limit) * 100) as percent_filled
FROM users 
WHERE is_active = true 
  AND plan_name != 'none' 
  AND daily_limit > 0
  AND leads_today < (daily_limit / 2)
  AND leads_today > 0
ORDER BY percent_filled ASC;
