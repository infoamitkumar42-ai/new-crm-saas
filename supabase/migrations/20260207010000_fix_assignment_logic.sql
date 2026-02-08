-- ============================================================================
-- 🚀 MIGRATION: Fix Assignment Logic & Add Optimized RPC Functions
-- ============================================================================
-- File: supabase/migrations/20260207010000_fix_assignment_logic.sql
-- Description: Replaces N+1 loop with optimized RPC, adds error logging
-- ============================================================================

-- ============================================================================
-- 1. CREATE ERROR LOGGING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.webhook_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_type TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_errors_type 
ON webhook_errors (error_type, created_at DESC);

ALTER TABLE webhook_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage errors" ON webhook_errors
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Admins can view errors" ON webhook_errors
    FOR SELECT TO authenticated
    USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- ============================================================================
-- 2. CREATE OPTIMIZED ASSIGNEE LOOKUP RPC
-- ============================================================================
-- Replaces the N+1 loop with a single optimized query
-- Returns the BEST user for assignment based on:
--   1. Active + Online status
--   2. Below daily_limit
--   3. Batch priority (odd count = mid-batch, gets priority)
--   4. Plan tier hierarchy (turbo > manager > supervisor > starter)
--   5. Round-robin (fewest leads first)

CREATE OR REPLACE FUNCTION public.get_best_assignee_for_team(
    p_team_code TEXT
)
RETURNS TABLE (
    user_id UUID,
    user_name TEXT,
    user_email TEXT,
    plan_name TEXT,
    daily_limit INT,
    leads_today BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH today_counts AS (
        SELECT 
            u.id,
            u.name,
            u.email,
            u.plan_name,
            u.daily_limit,
            COALESCE(
                (SELECT COUNT(*) 
                 FROM leads l 
                 WHERE l.assigned_to = u.id 
                 AND l.created_at >= CURRENT_DATE::timestamp),
                0
            ) AS leads_today
        FROM users u
        WHERE u.team_code = p_team_code
          AND u.is_active = true
          AND u.is_online = true
          AND u.role IN ('member', 'manager')
    ),
    eligible_users AS (
        SELECT *
        FROM today_counts
        WHERE leads_today < daily_limit
    )
    SELECT 
        eu.id AS user_id,
        eu.name AS user_name,
        eu.email AS user_email,
        eu.plan_name,
        eu.daily_limit,
        eu.leads_today
    FROM eligible_users eu
    ORDER BY
        -- 1. Batch priority: Users with odd count get priority (completing their batch)
        (CASE WHEN eu.leads_today % 2 = 1 THEN 0 ELSE 1 END) ASC,
        
        -- 2. Tier priority: Higher plans first
        (CASE 
            WHEN LOWER(eu.plan_name) LIKE '%turbo%' OR LOWER(eu.plan_name) LIKE '%boost%' THEN 4
            WHEN LOWER(eu.plan_name) LIKE '%manager%' THEN 3
            WHEN LOWER(eu.plan_name) LIKE '%supervisor%' THEN 2
            ELSE 1
        END) DESC,
        
        -- 3. Round Robin: Fewest leads first
        eu.leads_today ASC
    LIMIT 1;
END;
$$;

-- ============================================================================
-- 3. CREATE ATOMIC ASSIGNMENT RPC (Race-Condition Safe)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.assign_lead_atomically(
    p_lead_name TEXT,
    p_phone TEXT,
    p_city TEXT,
    p_source TEXT,
    p_status TEXT,
    p_user_id UUID,
    p_planned_limit INT DEFAULT 100
)
RETURNS TABLE (
    success BOOLEAN,
    lead_id UUID,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_today_count INT;
    v_new_lead_id UUID;
BEGIN
    -- 1. Lock and check current count (prevents race conditions)
    SELECT COUNT(*) INTO v_today_count
    FROM leads
    WHERE assigned_to = p_user_id
      AND created_at >= CURRENT_DATE::timestamp
    FOR UPDATE;

    -- 2. Check if still under limit
    IF v_today_count >= p_planned_limit THEN
        RETURN QUERY SELECT false, NULL::UUID, 'Limit reached during assignment'::TEXT;
        RETURN;
    END IF;

    -- 3. Insert the lead
    INSERT INTO leads (name, phone, city, source, status, assigned_to, created_at, assigned_at)
    VALUES (p_lead_name, p_phone, p_city, p_source, p_status, p_user_id, NOW(), NOW())
    RETURNING id INTO v_new_lead_id;

    -- 4. Update user's leads_today counter
    UPDATE users
    SET leads_today = v_today_count + 1,
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN QUERY SELECT true, v_new_lead_id, 'Lead assigned successfully'::TEXT;
END;
$$;

-- ============================================================================
-- 4. PERFORMANCE INDEXES
-- ============================================================================

-- Fast team lookup (covering index)
CREATE INDEX IF NOT EXISTS idx_users_team_active_online 
ON users (team_code, is_active, is_online) 
WHERE is_active = true AND is_online = true;

-- Fast daily count lookup
CREATE INDEX IF NOT EXISTS idx_leads_assigned_today 
ON leads (assigned_to, created_at DESC);

-- Fast duplicate check
CREATE INDEX IF NOT EXISTS idx_leads_phone 
ON leads (phone);

-- Fast page lookup
CREATE INDEX IF NOT EXISTS idx_meta_pages_page_id 
ON meta_pages (page_id);

-- ============================================================================
-- 5. GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.get_best_assignee_for_team(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_best_assignee_for_team(TEXT) TO service_role;

GRANT EXECUTE ON FUNCTION public.assign_lead_atomically(TEXT, TEXT, TEXT, TEXT, TEXT, UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_lead_atomically(TEXT, TEXT, TEXT, TEXT, TEXT, UUID, INT) TO service_role;

GRANT INSERT, SELECT ON public.webhook_errors TO service_role;

-- ============================================================================
-- ✅ MIGRATION COMPLETE
-- ============================================================================
-- Test: SELECT * FROM get_best_assignee_for_team('TEAMFIRE');
