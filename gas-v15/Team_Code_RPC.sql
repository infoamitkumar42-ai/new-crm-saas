-- ============================================================================
-- TEAM CODE RPC FUNCTIONS FOR LEADFLOW
-- ============================================================================
-- These functions are required for manager signup and team member joining
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS verify_team_code(text);
DROP FUNCTION IF EXISTS check_team_code_available(text);

-- ============================================================================
-- 1. VERIFY TEAM CODE - For members joining a manager's team
-- ============================================================================
-- Returns manager info if team code is valid

CREATE OR REPLACE FUNCTION verify_team_code(code text)
RETURNS TABLE(
    is_valid boolean,
    manager_id uuid,
    manager_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        true AS is_valid,
        u.id AS manager_id,
        u.name AS manager_name
    FROM users u
    WHERE u.team_code = UPPER(code)
      AND u.role = 'manager'
    LIMIT 1;
    
    -- If no rows returned, return invalid
    IF NOT FOUND THEN
        RETURN QUERY SELECT false::boolean, NULL::uuid, NULL::text;
    END IF;
END;
$$;

-- ============================================================================
-- 2. CHECK TEAM CODE AVAILABLE - For managers creating new team code
-- ============================================================================
-- Returns true if the code is available (not taken by any existing manager)

CREATE OR REPLACE FUNCTION check_team_code_available(code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    code_exists boolean;
BEGIN
    SELECT EXISTS(
        SELECT 1 
        FROM users 
        WHERE team_code = UPPER(code)
    ) INTO code_exists;
    
    -- Return TRUE if code does NOT exist (available)
    RETURN NOT code_exists;
END;
$$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION verify_team_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_team_code(text) TO anon;
GRANT EXECUTE ON FUNCTION check_team_code_available(text) TO authenticated;
GRANT EXECUTE ON FUNCTION check_team_code_available(text) TO anon;

-- ============================================================================
-- TEST QUERIES
-- ============================================================================
-- After running above, test with:
-- SELECT * FROM verify_team_code('YOUR_CODE');
-- SELECT check_team_code_available('NEW_CODE');
