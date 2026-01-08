-- ============================================================================
-- LEADFLOW v15.0 - SUPABASE SQL RPC FUNCTIONS
-- ============================================================================
-- Run this FIRST in Supabase SQL Editor before deploying GAS code
-- ============================================================================

-- ============================================================================
-- 🗑️ DROP EXISTING FUNCTIONS FIRST (Required for return type changes)
-- ============================================================================

DROP FUNCTION IF EXISTS increment_lead_count_safe(UUID);
DROP FUNCTION IF EXISTS reset_daily_leads();
DROP FUNCTION IF EXISTS get_available_users_by_priority();

-- ============================================================================
-- 1. MAIN FUNCTION: increment_lead_count_safe (v15.0)
-- ============================================================================
-- Purpose: Atomically claim a lead slot for a user
-- Checks: Active plan + Under daily limit + 15-min cooling period
-- Returns: TRUE if slot claimed, FALSE otherwise
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_lead_count_safe(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rows_updated INT;
BEGIN
    -- Single atomic UPDATE with all business rules in WHERE clause
    -- PostgreSQL row-level lock ensures only one concurrent transaction succeeds
    UPDATE users_subscription
    SET 
        leads_sent = leads_sent + 1,
        last_lead_assigned_at = NOW(),
        updated_at = NOW()
    WHERE 
        user_id = target_user_id
        AND plan_status = 'Active'
        AND leads_sent < daily_limit
        AND (
            last_lead_assigned_at IS NULL 
            OR last_lead_assigned_at < (NOW() - INTERVAL '15 minutes')
        );
    
    -- Check how many rows were affected
    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    
    -- Return TRUE only if exactly 1 row was updated
    RETURN rows_updated = 1;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION increment_lead_count_safe(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_lead_count_safe(UUID) TO service_role;

-- Add documentation
COMMENT ON FUNCTION increment_lead_count_safe(UUID) IS 
'v15.0 - Atomically claims a lead slot. Returns TRUE if: plan active + under limit + 15min cooldown passed. Prevents race conditions.';


-- ============================================================================
-- 2. DAILY RESET FUNCTION: reset_daily_leads
-- ============================================================================
-- Purpose: Reset leads_sent counter for all users at midnight
-- Called by: Triggers.gs at 12:00 AM IST
-- ============================================================================

CREATE OR REPLACE FUNCTION reset_daily_leads()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rows_reset INT;
BEGIN
    UPDATE users_subscription
    SET 
        leads_sent = 0,
        updated_at = NOW()
    WHERE leads_sent > 0;
    
    GET DIAGNOSTICS rows_reset = ROW_COUNT;
    
    -- Log the reset
    INSERT INTO system_logs (action, details, created_at)
    VALUES ('daily_reset', 'Reset ' || rows_reset || ' user counters', NOW());
    
    RETURN rows_reset;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION reset_daily_leads() TO service_role;

COMMENT ON FUNCTION reset_daily_leads() IS 
'Resets leads_sent to 0 for all users. Run at midnight IST.';


-- ============================================================================
-- 3. HELPER FUNCTION: get_available_users_by_priority
-- ============================================================================
-- Purpose: Get users who can receive leads RIGHT NOW
-- Returns: Users sorted by plan_priority (Booster=1, Manager=2, Supervisor=3, Starter=4)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_available_users_by_priority()
RETURNS TABLE (
    user_id UUID,
    user_name TEXT,
    email TEXT,
    phone TEXT,
    plan_name TEXT,
    plan_priority INT,
    daily_limit INT,
    leads_sent INT,
    last_lead_assigned_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        us.user_id,
        u.name AS user_name,
        u.email,
        u.phone,
        us.plan_name,
        CASE us.plan_name
            WHEN 'Booster' THEN 1
            WHEN 'Manager' THEN 2
            WHEN 'Supervisor' THEN 3
            WHEN 'Starter' THEN 4
            ELSE 5
        END AS plan_priority,
        us.daily_limit,
        us.leads_sent,
        us.last_lead_assigned_at
    FROM users_subscription us
    JOIN users u ON u.id = us.user_id
    WHERE 
        us.plan_status = 'Active'
        AND us.leads_sent < us.daily_limit
        AND (
            us.last_lead_assigned_at IS NULL 
            OR us.last_lead_assigned_at < (NOW() - INTERVAL '15 minutes')
        )
    ORDER BY plan_priority ASC, us.leads_sent ASC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_available_users_by_priority() TO service_role;

COMMENT ON FUNCTION get_available_users_by_priority() IS 
'Returns available users sorted by priority: Booster > Manager > Supervisor > Starter';


-- ============================================================================
-- 4. OPTIONAL: Add last_lead_assigned_at column if missing
-- ============================================================================
-- Run this ONLY if the column doesn't exist

-- Check if column exists first:
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'users_subscription' AND column_name = 'last_lead_assigned_at';

-- If missing, run:
-- ALTER TABLE users_subscription ADD COLUMN last_lead_assigned_at TIMESTAMPTZ DEFAULT NULL;


-- ============================================================================
-- 5. OPTIONAL: Create system_logs table for tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);

COMMENT ON TABLE system_logs IS 'System operation logs for LeadFlow v15.0';


-- ============================================================================
-- VERIFICATION QUERIES (Run after deploying)
-- ============================================================================

-- Test 1: Check if functions exist
-- SELECT proname FROM pg_proc WHERE proname IN ('increment_lead_count_safe', 'reset_daily_leads', 'get_available_users_by_priority');

-- Test 2: Test atomic increment (use a real user_id)
-- SELECT increment_lead_count_safe('your-user-uuid-here');

-- Test 3: Check available users
-- SELECT * FROM get_available_users_by_priority();
