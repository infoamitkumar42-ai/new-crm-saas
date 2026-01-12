-- ============================================================================
-- FINAL AUTH & TEAM CODE FIX
-- ============================================================================
-- 1. Updates Rajwinder's code to 'TEAMRAJ' (as requested)
-- 2. Re-installs Verification Logic (RPC)
-- ============================================================================

-- 1. Update Rajwinder's Team Code to TEAMRAJ
UPDATE users 
SET team_code = 'TEAMRAJ'
WHERE email = 'rajwinder@gmail.com';

-- 2. Drop existing functions to ensure clean slate
DROP FUNCTION IF EXISTS verify_team_code(text);
DROP FUNCTION IF EXISTS check_team_code_available(text);

-- 3. Install Verify Function
CREATE OR REPLACE FUNCTION verify_team_code(code text)
RETURNS TABLE(
    is_valid boolean,
    manager_id uuid,
    manager_name text
)
LANGUAGE plpgsql
SECURITY DEFINER -- Bypass RLS
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
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false::boolean, NULL::uuid, NULL::text;
    END IF;
END;
$$;

-- 4. Install Availability Check Function
CREATE OR REPLACE FUNCTION check_team_code_available(code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Bypass RLS
AS $$
DECLARE
    code_exists boolean;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM users WHERE team_code = UPPER(code)
    ) INTO code_exists;
    RETURN NOT code_exists;
END;
$$;

-- 5. Grant Public Permissions
GRANT EXECUTE ON FUNCTION verify_team_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_team_code(text) TO anon;
GRANT EXECUTE ON FUNCTION check_team_code_available(text) TO authenticated;
GRANT EXECUTE ON FUNCTION check_team_code_available(text) TO anon;

-- Verification
SELECT name, email, team_code FROM users WHERE role = 'manager';
