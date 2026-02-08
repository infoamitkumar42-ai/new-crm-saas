-- ============================================================================
-- 🏥 COMPREHENSIVE SYSTEM HEALTH CHECK
-- ============================================================================

-- 1. CHECK LATEST LEADS (Real-time Assignment Test)
SELECT 
    '1. LATEST LEADS (Last 30 min)' as check_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN status = 'Assigned' THEN 1 END) as assigned_count,
    COUNT(CASE WHEN status = 'Queued' THEN 1 END) as queued_count,
    COUNT(CASE WHEN status = 'New' THEN 1 END) as new_count
FROM leads 
WHERE created_at >= NOW() - INTERVAL '30 minutes';

-- 2. CHECK USER VISIBILITY (user_id should be populated)
SELECT 
    '2. USER VISIBILITY' as check_name,
    COUNT(*) as total_assigned_today,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as null_user_id_count,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as valid_user_id_count
FROM leads 
WHERE status = 'Assigned' AND created_at >= CURRENT_DATE;

-- 3. CHECK ROTATION FAIRNESS (Today's Distribution)
SELECT 
    '3. ROTATION CHECK' as check_name,
    u.name,
    u.leads_today,
    u.daily_limit,
    u.is_active,
    u.is_online,
    u.last_assigned_at
FROM users u
WHERE u.team_code = (SELECT team_code FROM users WHERE is_active = true LIMIT 1)
  AND u.is_active = true
ORDER BY u.leads_today ASC, u.last_assigned_at ASC NULLS FIRST;

-- 4. CHECK TOKEN STATUS (Are tokens still valid?)
SELECT 
    '4. TOKEN HEALTH' as check_name,
    COUNT(*) as total_pages,
    COUNT(CASE WHEN access_token IS NOT NULL AND LENGTH(access_token) > 100 THEN 1 END) as valid_tokens
FROM meta_pages;

-- 5. CHECK FOR QUOTA VIOLATIONS (Users over limit)
SELECT 
    '5. QUOTA VIOLATIONS' as check_name,
    COUNT(*) as users_over_limit
FROM users 
WHERE leads_today > daily_limit;

-- 6. CHECK WEBHOOK ERRORS (Recent failures)
SELECT 
    '6. WEBHOOK ERRORS (Last 24h)' as check_name,
    COUNT(*) as error_count
FROM webhook_errors 
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- 7. TEST NEXT ASSIGNMENT (Who will get the next lead?)
SELECT 
    '7. NEXT IN LINE' as check_name,
    user_name,
    leads_today,
    daily_limit
FROM get_best_assignee_for_team((SELECT team_code FROM users WHERE is_active = true LIMIT 1));
