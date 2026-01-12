-- ============================================================================
-- 📊 CURRENT DISTRIBUTION STATUS CHECK
-- ============================================================================

-- 1. Summary Counts
SELECT 
    COUNT(*) FILTER (WHERE leads_today >= daily_limit) as quota_full_users,
    COUNT(*) FILTER (WHERE leads_today > 0 AND leads_today < daily_limit) as partial_users,
    COUNT(*) FILTER (WHERE leads_today = 0) as zero_lead_users,
    COUNT(*) as total_active_users
FROM users 
WHERE payment_status = 'active' 
AND is_active = true;

-- 2. Detailed List: Users with 0 Leads (The "Starved" List)
SELECT 
    name, 
    plan_name, 
    daily_limit, 
    target_state, 
    target_gender
FROM users 
WHERE payment_status = 'active'
AND is_active = true
AND leads_today = 0
ORDER BY plan_name DESC;

-- 3. Detailed List: Users needing more leads (Partial)
SELECT 
    name,
    plan_name,
    leads_today,
    daily_limit,
    (daily_limit - leads_today) as leads_pending
FROM users 
WHERE payment_status = 'active'
AND is_active = true
AND leads_today > 0 
AND leads_today < daily_limit
ORDER BY leads_pending DESC;
