-- ============================================================================
-- 🏥 SYSTEM HEALTH CHECK - JAN 11, 2026
-- ============================================================================

-- 1. 📊 OVERVIEW: Total Distribution Today
SELECT 
    COUNT(*) as total_leads_assigned_today,
    MAX(assigned_at) as last_assignment_time,
    (NOW() AT TIME ZONE 'Asia/Kolkata') as current_time_ist
FROM leads 
WHERE (assigned_at AT TIME ZONE 'Asia/Kolkata')::date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date;

-- 2. 🛡️ LIMIT CHECK: Any Over-Limit Users Today? (Should be EMPTY)
SELECT 
    name, 
    leads_today, 
    daily_limit,
    (leads_today - daily_limit) as over_limit_by
FROM users 
WHERE leads_today > daily_limit
AND payment_status = 'active';

-- 3. 🍽️ STARVATION CHECK: Active Users with 0 Leads (and available limit)
SELECT 
    name, 
    plan_name, 
    leads_today, 
    daily_limit,
    target_state,
    last_lead_time
FROM users 
WHERE payment_status = 'active' 
AND is_active = true
AND leads_today = 0
ORDER BY plan_name DESC;

-- 4. 📈 HOURLY DISTRIBUTION TODAY
SELECT 
    EXTRACT(HOUR FROM (assigned_at AT TIME ZONE 'Asia/Kolkata'))::int as hour,
    COUNT(*) as leads_count
FROM leads 
WHERE (assigned_at AT TIME ZONE 'Asia/Kolkata')::date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date
GROUP BY hour
ORDER BY hour ASC;
