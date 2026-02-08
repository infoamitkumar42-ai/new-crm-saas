
-- ============================================================================
-- 🛡️ FIX ROW LEVEL SECURITY (RLS) FOR DASHBOARD VISIBILITY
-- ============================================================================

-- 1. ENABLE RLS (Safe to run multiple times)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- 2. DROP EXISTING RESTRICTIVE POLICIES (To avoid conflicts)
DROP POLICY IF EXISTS "Admins can see everything" ON users;
DROP POLICY IF EXISTS "Managers can see everything" ON users;
DROP POLICY IF EXISTS "Admins can see leads" ON leads;
DROP POLICY IF EXISTS "Managers can see leads" ON leads;
DROP POLICY IF EXISTS "View own data" ON users;
DROP POLICY IF EXISTS "View own leads" ON leads;

-- 3. CREATE PERMISSIVE POLICIES FOR ADMINS & MANAGERS

-- ✅ USERS TABLE: Admins & Managers see ALL users
CREATE POLICY "Staff can view all users"
ON users
FOR SELECT
USING (
    (auth.jwt() ->> 'role' = 'service_role') OR
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager') OR
    auth.uid() = id -- Users see themselves
);

-- ✅ LEADS TABLE: Admins & Managers see ALL leads
CREATE POLICY "Staff can view all leads"
ON leads
FOR SELECT
USING (
    (auth.jwt() ->> 'role' = 'service_role') OR
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager') OR
    assigned_to = auth.uid() -- Users see their own leads
);

-- ✅ USER ACTIVITY TABLE
CREATE POLICY "Staff can view all activity"
ON user_activity
FOR SELECT
USING (
    (auth.jwt() ->> 'role' = 'service_role') OR
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager') OR
    user_id = auth.uid()
);

-- 4. GRANT SELECT PERMISSIONS TO ROLES
GRANT SELECT ON users TO authenticated;
GRANT SELECT ON leads TO authenticated;
GRANT SELECT ON user_activity TO authenticated;

-- 5. VERIFY ADMIN ROLE (Ensure the current user actually HAS the role)
-- (Optional: You would run this manually if you suspect your user role is wrong)
-- SELECT id, role FROM users WHERE id = auth.uid();

