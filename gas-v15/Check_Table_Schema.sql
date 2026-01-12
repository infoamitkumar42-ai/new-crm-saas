-- ============================================================================
-- 🕵️‍♂️ CHECK TABLE SCHEMA & POLICIES
-- ============================================================================

-- 1. Check if table exists and show columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'push_subscriptions';

-- 2. Check RLS enablement
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'push_subscriptions';

-- 3. Check existing policies
SELECT polname, polcmd, polroles 
FROM pg_policy 
WHERE polrelid = 'public.push_subscriptions'::regclass;
