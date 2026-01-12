-- ============================================================================
-- 🧠 DEEP LOGIC VERIFICATION (The "Truth" Script)
-- ============================================================================

-- 1. 🚨 CRITICAL FAILURES: Users Over Limit (System Error if > 0)
SELECT 
    'Over Limit Users' as check_type,
    COUNT(*) as failure_count,
    string_agg(name, ', ') as affected_users
FROM users 
WHERE leads_today > daily_limit 
AND payment_status = 'active';

-- 2. 🧩 LOGIC CHECK: Starving Users vs Matching Pending Leads
-- This checks: "Are there users waiting for leads that actually EXIST in the queue?"
SELECT 
    u.name as hungry_user,
    u.target_state as user_wants,
    COUNT(l.id) as matching_leads_waiting
FROM users u
CROSS JOIN leads l
WHERE u.leads_today = 0             -- User is hungry
AND u.payment_status = 'active'     -- User is active
AND u.is_active = true              -- User is not paused
AND l.status = 'New'                -- Lead is waiting
AND l.user_id IS NULL
AND (
    u.target_state = 'All India'    -- User accepts anything
    OR l.state = u.target_state     -- OR State matches exact
    OR (l.state IS NULL AND u.target_state = 'All India') -- Handle nulls
)
GROUP BY u.name, u.target_state
ORDER BY matching_leads_waiting DESC;

-- 3. ✅ SUCCESS PROOF: Last 5 Successful Distributions
SELECT 
    l.assigned_at, 
    l.city, 
    l.state, 
    u.name as assigned_to, 
    u.leads_today as user_score_at_time
FROM leads l
JOIN users u ON l.user_id = u.id
WHERE l.assigned_at IS NOT NULL
ORDER BY l.assigned_at DESC
LIMIT 5;

-- 📝 INTERPRETATION:
-- 1. If "Over Limit Users" > 0 -> LIMIT LOGIC BROKEN.
-- 2. If "matching_leads_waiting" > 0 -> DISTRIBUTION LOGIC BROKEN (User waiting, Lead waiting, No match).
-- 3. If "matching_leads_waiting" is EMPTY/Zero -> SYSTEM PERFECT (Supply Shortage, just wait).
