
-- ============================================================================
-- 🚑 FIX LEAD VISIBILITY & ROLE DETECTION
-- ============================================================================

-- 1. BROADEN LEADS VISIBILITY
-- Using both user_id (Owner) and assigned_to (Worker) ensures no leads are hidden.
DROP POLICY IF EXISTS "Staff can view all leads" ON leads;

CREATE POLICY "Staff can view all leads"
ON leads FOR SELECT
USING (
    user_id = auth.uid()       -- You own the lead
    OR
    assigned_to = auth.uid()   -- You are working the lead
    OR
    is_admin_or_manager()      -- You are Boss
);

-- 2. ENSURE ROLE DETECTION IS BULLETPROOF
-- Sometimes 'auth.uid() = id' is not enough if the query uses filters?
-- We explicitly Allow Admins to see EVERYTHING in users table via the function.

DROP POLICY IF EXISTS "Staff can view all users" ON users;

CREATE POLICY "Staff can view all users"
ON users FOR SELECT
USING (
    id = auth.uid()            -- See yourself (Absolute Base Case)
    OR
    is_admin_or_manager()      -- See everyone else if you are admin
);

-- 3. RE-VERIFY FUNCTION PERMISSIONS
GRANT EXECUTE ON FUNCTION public.is_admin_or_manager() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_or_manager() TO service_role;
GRANT SELECT ON users TO authenticated;
GRANT SELECT ON leads TO authenticated;

