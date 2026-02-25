-- ============================================================================
-- 🛡️ PERMANENT FIX: LEAD VISIBILITY & RLS STANDARDIZATION
-- ============================================================================

BEGIN;

-- 1. DROP ALL OLD/CONFLICTING POLICIES
DROP POLICY IF EXISTS "Users can view their own leads" ON leads;
DROP POLICY IF EXISTS "Staff can view all leads" ON leads;
DROP POLICY IF EXISTS "Admins can see leads" ON leads;
DROP POLICY IF EXISTS "Managers can see leads" ON leads;
DROP POLICY IF EXISTS "View own leads" ON leads;

-- 2. CREATE NEW UNIFIED POLICY
-- This allows:
--  - Admins & Managers to see ALL leads
--  - Members to see leads where they are the owner (user_id) OR the assignee (assigned_to)
CREATE POLICY "Unified Lead Access Control"
ON leads
FOR SELECT
USING (
    (auth.jwt() ->> 'role' = 'service_role') OR
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND (role IN ('admin', 'manager') OR id = leads.user_id OR id = leads.assigned_to)
    )
);

-- 3. DATA REPAIR: Sync user_id and assigned_to
-- We ensure that EVERY assigned lead has both fields populated for redundancy and RLS.
UPDATE leads
SET user_id = assigned_to
WHERE assigned_to IS NOT NULL
  AND (user_id IS NULL OR user_id != assigned_to);

-- 4. UPDATE ATOMIC ASSIGNMENT FUNCTION
-- This ensures future leads are ALWAYS consistent.
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
    -- 1. Lock and check current count
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

    -- 3. Insert the lead (ALWAYS SET BOTH FIELDS)
    INSERT INTO leads (
        name, phone, city, source, status, 
        assigned_to, user_id, 
        created_at, assigned_at
    )
    VALUES (
        p_lead_name, p_phone, p_city, p_source, p_status, 
        p_user_id, p_user_id, 
        NOW(), NOW()
    )
    RETURNING id INTO v_new_lead_id;

    -- 4. Update user's leads_today counter
    UPDATE users
    SET leads_today = v_today_count + 1,
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN QUERY SELECT true, v_new_lead_id, 'Lead assigned successfully'::TEXT;
END;
$$;

COMMIT;

-- VERIFICATION
SELECT 
    (SELECT COUNT(*) FROM leads WHERE user_id IS NULL AND assigned_to IS NOT NULL) as orphans,
    (SELECT COUNT(*) FROM leads WHERE user_id != assigned_to) as mismatches;
