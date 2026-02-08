
-- ============================================================================
-- 🛠️ FIX ACTIVITY LOG PERMISSIONS
-- ============================================================================
-- Issue: Frontend might try to log activity and fail if policies are missing.
-- Fix: Grant INSERT permission on 'user_activity'.

BEGIN;

DROP POLICY IF EXISTS "Users can insert their own activity" ON user_activity;

CREATE POLICY "Enable insert for authenticated users" 
ON user_activity 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Also ensure SELECT is open for own activity
DROP POLICY IF EXISTS "Users can view their own activity" ON user_activity;
CREATE POLICY "Enable view own activity" 
ON user_activity 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

COMMIT;

SELECT count(*) as activity_policies FROM pg_policies WHERE tablename = 'user_activity';
