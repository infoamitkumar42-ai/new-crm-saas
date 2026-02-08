
-- ============================================================================
-- 🚑 EMERGENCY FIX: RLS RECURSION ERROR ("Profile Not Found")
-- ============================================================================

-- The previous policy caused an infinite loop: "To read my role, I need to read the users table, but I can't read the users table until I know my role."

-- 1. Helper Function to safely check role (Bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin_or_manager()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- ⚠️ Runs as Owner (Postgres), ignoring RLS
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'manager')
    );
END;
$$;

-- 2. DROP BROKEN POLICIES
DROP POLICY IF EXISTS "Staff can view all users" ON users;
DROP POLICY IF EXISTS "Staff can view all leads" ON leads;
DROP POLICY IF EXISTS "Staff can view all activity" ON user_activity;

-- 3. APPLY NON-RECURSIVE POLICIES

-- ✅ USERS TABLE
CREATE POLICY "Staff can view all users"
ON users FOR SELECT
USING (
    auth.uid() = id -- Always see yourself (Base case)
    OR
    is_admin_or_manager() -- Recursive check safely handled by Security Definer function
);

-- ✅ LEADS TABLE
CREATE POLICY "Staff can view all leads"
ON leads FOR SELECT
USING (
    assigned_to = auth.uid() -- See own leads
    OR
    is_admin_or_manager() -- Admins/Managers see all
);

-- ✅ USER ACTIVITY TABLE
CREATE POLICY "Staff can view all activity"
ON user_activity FOR SELECT
USING (
    user_id = auth.uid()
    OR
    is_admin_or_manager()
);

-- 4. GRANT PERMISSIONS (Just in case)
GRANT EXECUTE ON FUNCTION public.is_admin_or_manager() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_or_manager() TO service_role;

