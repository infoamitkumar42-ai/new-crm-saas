
-- ============================================================================
-- ♻️ FIX RLS INFINITE RECURSION (FINAL FORCE VERSION)
-- ============================================================================
-- Problem: Policy on 'users' table queries 'users' table to check role. This causes a loop.
-- Solution: Drops ALL conflicting policies and re-creates safely.

BEGIN;

-- 1. Helper Function
CREATE OR REPLACE FUNCTION public.is_admin_or_manager()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'manager')
  );
$$;

-- 2. DROP ALL POTENTIAL POLICIES (To avoid 'already exists' error)
DROP POLICY IF EXISTS "Enable access for admins and managers" ON users;
DROP POLICY IF EXISTS "Staff can view all users" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Managers can view all users" ON users;
DROP POLICY IF EXISTS "View own user data" ON users;
DROP POLICY IF EXISTS "Users can see themselves" ON users;

-- 3. CREATE NEW SAFE POLICY (For Users Table)
CREATE POLICY "Enable access for admins and managers"
ON users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id -- Users can always see themselves
  OR
  is_admin_or_manager() = true -- Admins/Managers can see everyone
);

-- 4. FIX LEADS POLICY (Just in case)
DROP POLICY IF EXISTS "Enable access for staff to all leads" ON leads;
DROP POLICY IF EXISTS "Staff can view all leads" ON leads;

CREATE POLICY "Enable access for staff to all leads"
ON leads
FOR SELECT
TO authenticated
USING (
  assigned_to = auth.uid() -- Own leads
  OR
  is_admin_or_manager() = true -- Staff see all
);

COMMIT;
