-- ============================================================================
-- 🕵️‍♂️ DEEP DIVE: NAVJOT vs RAJBIR
-- ============================================================================

-- 1. Check Source of 17 Leads for knavjotkaur113
SELECT 
    l.source,
    COUNT(*) as count
FROM leads l
JOIN users u ON l.user_id = u.id
WHERE u.email = 'knavjotkaur113@gmail.com'
AND (l.assigned_at AT TIME ZONE 'Asia/Kolkata')::date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date
GROUP BY l.source;

-- 2. Check Targeting & Status for rajbirsingh97843 (The Starved User)
SELECT 
    name, 
    email, 
    plan_name, 
    target_state, 
    target_gender, 
    leads_today, 
    daily_limit, 
    last_lead_time,
    is_active,
    payment_status,
    last_activity,
    (NOW() - last_activity) as time_since_active
FROM users 
WHERE email = 'rajbirsingh97843@gmail.com';

-- 3. Check if any 'New' leads match Rajbir's criteria
SELECT 
    COUNT(*) as matching_leads_waiting
FROM leads l
CROSS JOIN users u
WHERE u.email = 'rajbirsingh97843@gmail.com'
AND l.status = 'New' 
AND l.user_id IS NULL
-- Check State Match
AND (u.target_state = 'All India' OR l.state = u.target_state OR l.state IS NULL)
-- Check Gender Match (simplified)
AND (u.target_gender = 'All' OR l.name IS NOT NULL); -- Assuming simple check for now
