-- ============================================================================
-- 🔧 FIX PUSH SUBSCRIPTIONS PERMISSIONS & CONSTRAINTS
-- ============================================================================

-- 1. Ensure Unique Constraint (Critical for UPSERT)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'push_subscriptions_user_id_endpoint_key'
    ) THEN
        ALTER TABLE push_subscriptions
        ADD CONSTRAINT push_subscriptions_user_id_endpoint_key UNIQUE (user_id, endpoint);
    END IF;
END $$;

-- 2. Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 3. Reset Policies (Grants SELECT, INSERT, UPDATE, DELETE)

-- Drop existing to avoid conflicts
DROP POLICY IF EXISTS "Users can insert their own subscription" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can read their own subscription" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can delete their own subscription" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscription" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can manage their own subscriptions" ON push_subscriptions;

-- Create Unified Policy (Best Practice)
CREATE POLICY "Users can manage their own subscriptions"
ON push_subscriptions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Grant Permissions to Authenticated Roles
GRANT ALL ON push_subscriptions TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE push_subscriptions_id_seq TO authenticated;

-- 5. Verification
SELECT * FROM pg_policies WHERE tablename = 'push_subscriptions';
