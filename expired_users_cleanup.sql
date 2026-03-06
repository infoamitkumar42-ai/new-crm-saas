-- ==============================================================================
-- 1. PREVIEW QUERY: See which active users have expired plans
-- ==============================================================================
-- Run this first to see exactly who will be deactivated.
-- It checks for users who are marked active but their valid_until date is in the past.

SELECT 
    id, 
    name, 
    email, 
    phone, 
    team_code, 
    plan_name, 
    valid_until, 
    plan_start_date,
    total_leads_received,
    total_leads_promised
FROM 
    users
WHERE 
    is_active = true 
    AND valid_until IS NOT NULL 
    AND valid_until < NOW()
ORDER BY 
    valid_until ASC;

-- ==============================================================================
-- 2. UPDATE QUERY: Deactivate expired users
-- ==============================================================================
-- Run this to actually update the database.

/*
UPDATE users
SET 
    is_active = false,
    payment_status = 'expired', -- Optional: update payment status if needed
    updated_at = NOW()
WHERE 
    is_active = true 
    AND valid_until IS NOT NULL 
    AND valid_until < NOW();
*/

-- ==============================================================================
-- 3. DISTRIBUTION LOGIC SAFETY NET
-- ==============================================================================
-- If your webhook or RPC function (e.g., get_best_assignee_for_team) fetches 
-- eligible users, it should ideally have this condition added to the WHERE clause:
-- 
-- AND u.is_active = true 
-- AND (u.valid_until IS NULL OR u.valid_until > NOW())
-- 
-- By running the UPDATE query above, 'is_active' becomes false, which automatically
-- stops the current distribution logic from assigning them leads. 
-- However, adding the valid_until check directly into the distribution RPC ensures 
-- they never receive leads even if someone forgets to manually run this update script.
