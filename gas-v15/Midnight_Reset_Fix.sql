-- ============================================================================
-- MIDNIGHT RESET SAFETY FIX
-- ============================================================================
-- Purpose: Ensures BOTH tables are reset at 12:00 AM IST
-- Also resets temporary Booster status back to original plans
-- ============================================================================

CREATE OR REPLACE FUNCTION reset_daily_leads()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rows_reset INT;
BEGIN
    -- 1. Reset 'users' table counters
    UPDATE users 
    SET leads_today = 0, last_lead_time = NULL 
    WHERE leads_today > 0;

    -- 2. Reset 'users_subscription' table counters
    UPDATE users_subscription
    SET 
        leads_sent = 0,
        last_lead_assigned_at = NULL,
        updated_at = NOW()
    WHERE leads_sent > 0;

    -- 3. Reset temporary 'Booster' plan names to their base roles
    -- (Safety: Ensures everyone goes back to their paid plan)
    UPDATE users_subscription us
    SET plan_name = u.role -- Or set to a default if role is member
    FROM users u 
    WHERE u.id = us.user_id 
    AND us.plan_name = 'Booster'
    AND u.role IN ('supervisor', 'starter', 'manager');

    GET DIAGNOSTICS rows_reset = ROW_COUNT;
    
    -- Log the reset
    INSERT INTO system_logs (action, details, created_at)
    VALUES ('daily_reset', 'Fully reset ' || rows_reset || ' users for midnight.', NOW());
    
    RETURN rows_reset;
END;
$$;

-- Verification
SELECT reset_daily_leads(); -- This resets it right now for testing (Don't run yet if you don't want to reset NOW)
