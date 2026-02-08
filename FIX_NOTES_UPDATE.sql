
-- ============================================================================
-- 🛠️ FIX NOTES SAVING (UPDATE PERMISSIONS)
-- ============================================================================
-- Issue: Users cannot save notes because they lack UPDATE permission on 'leads'.
-- Fix: Add explicit RLS policy for UPDATE.

BEGIN;

-- 1. Drop existing UPDATE policies to avoid conflicts
DROP POLICY IF EXISTS "Users can update their own leads" ON leads;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON leads;
DROP POLICY IF EXISTS "Enable update for assigned leads" ON leads;

-- 2. Create Comprehensive UPDATE Policy
-- Allows User to update lead if:
-- a) They are the Owner (user_id)
-- b) They are Assigned the lead (assigned_to)
-- c) They are Admin/Manager
CREATE POLICY "Enable update for leads" 
ON leads 
FOR UPDATE 
TO authenticated 
USING (
    auth.uid() = user_id 
    OR 
    auth.uid() = assigned_to 
    OR 
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'manager', 'super_admin')
    )
)
WITH CHECK (
    auth.uid() = user_id 
    OR 
    auth.uid() = assigned_to 
    OR 
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'manager', 'super_admin')
    )
);

COMMIT;

-- 3. Verify
SELECT count(*) as policies_active FROM pg_policies WHERE tablename = 'leads';
