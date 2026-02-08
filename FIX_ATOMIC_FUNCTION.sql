-- ============================================================================
-- 🛠️ FIX ATOMIC ASSIGNMENT (Race Condition Safe)
-- ============================================================================

-- Issue 1: "FOR UPDATE is not allowed with aggregate functions"
-- Fix: Lock the user row instead of the aggregate count.

-- Issue 2: Duplicate get_best_assignee_for_team functions.
-- Fix: Drop the ambiguous one.

BEGIN;

-- 1. Drop Duplicate Function (just in case)
DROP FUNCTION IF EXISTS get_best_assignee_for_team(text, text);

-- 2. Redefine assign_lead_atomically (Safe Version)
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
    -- 1. LOCK the user row (Wait here if another assignment is happening for this user)
    -- This serializes assignments for this specific user, preventing race conditions.
    PERFORM 1 FROM users WHERE id = p_user_id FOR UPDATE;

    -- 2. Check current count
    SELECT COUNT(*) INTO v_today_count
    FROM leads
    WHERE assigned_to = p_user_id
      AND created_at >= CURRENT_DATE::timestamp;

    -- 3. Check limit
    IF v_today_count >= p_planned_limit THEN
        RETURN QUERY SELECT false, NULL::UUID, 'Limit reached during assignment'::TEXT;
        RETURN;
    END IF;

    -- 4. Insert the lead
    INSERT INTO leads (name, phone, city, source, status, assigned_to, created_at, assigned_at)
    VALUES (p_lead_name, p_phone, p_city, p_source, p_status, p_user_id, NOW(), NOW())
    RETURNING id INTO v_new_lead_id;

    -- 5. Update user's leads_today counter
    UPDATE users
    SET leads_today = v_today_count + 1,
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN QUERY SELECT true, v_new_lead_id, 'Lead assigned successfully'::TEXT;
EXCEPTION WHEN OTHERS THEN
    -- Log error if needed, but for now just return false
    RETURN QUERY SELECT false, NULL::UUID, 'Error: ' || SQLERRM;
END;
$$;

COMMIT;

-- 3. Verify Fix by Simulating Assignment
DO $$
DECLARE
    v_user_id UUID;
    v_success BOOLEAN;
    v_message TEXT;
    v_lead_id UUID;
BEGIN
    -- Get best user (With explicit cast)
    SELECT user_id INTO v_user_id FROM get_best_assignee_for_team('GJ01TEAMFIRE'::text);
    
    IF v_user_id IS NOT NULL THEN
        RAISE NOTICE '✅ Found User: %', v_user_id;
        
        -- Try to assign (Simulating webhook call)
        SELECT success, lead_id, message INTO v_success, v_lead_id, v_message
        FROM assign_lead_atomically(
            'Test Lead Fix', '9999999998', 'Test City', 'Test Source', 'New', v_user_id, 100
        );
        
        RAISE NOTICE '📝 Assignment Result: Success=%, Message=%', v_success, v_message;

        -- Cleanup Test Lead
        IF v_success THEN
            DELETE FROM leads WHERE id = v_lead_id;
            -- Fixing counter is acceptable since it's just 1 lead test
            UPDATE users SET leads_today = leads_today - 1 WHERE id = v_user_id;
        END IF;
    ELSE
        RAISE NOTICE '❌ Still no user found for GJ01TEAMFIRE';
    END IF;
END $$;
