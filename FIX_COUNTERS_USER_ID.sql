-- ============================================================================
-- 🔧 FIX COUNTERS TO MATCH DASHBOARD (Use user_id, not assigned_to)
-- ============================================================================

-- Step 1: Verify current mismatch
SELECT 
    name,
    email,
    total_leads_received as counter,
    (SELECT COUNT(*) FROM leads WHERE user_id = users.id) as actual_user_id,
    (SELECT COUNT(*) FROM leads WHERE assigned_to = users.id) as actual_assigned_to,
    (SELECT COUNT(*) FROM leads WHERE user_id = users.id) - COALESCE(total_leads_received, 0) as difference
FROM users
WHERE email = 'sharmahimanshu9797@gmail.com';

-- Step 2: Fix ALL counters to use user_id (DASHBOARD METHOD)
UPDATE users 
SET total_leads_received = (
    SELECT COUNT(*) 
    FROM leads 
    WHERE leads.user_id = users.id
)
WHERE team_code IN ('TEAMFIRE', 'TEAMRAJ', 'GJ01TEAMFIRE');

-- Step 3: Verify Himanshu's counter is now 209
SELECT 
    name,
    email,
    total_leads_received as counter,
    (SELECT COUNT(*) FROM leads WHERE user_id = users.id) as actual_count
FROM users
WHERE email = 'sharmahimanshu9797@gmail.com';

-- Step 4: Check ALL users are synced
SELECT 
    name, email,
    total_leads_received as counter,
    (SELECT COUNT(*) FROM leads WHERE user_id = users.id) as actual,
    CASE 
        WHEN total_leads_received = (SELECT COUNT(*) FROM leads WHERE user_id = users.id) 
        THEN '✅ SYNCED' 
        ELSE '❌ OUT OF SYNC' 
    END as status
FROM users
WHERE team_code IN ('TEAMFIRE', 'TEAMRAJ', 'GJ01TEAMFIRE')
  AND (SELECT COUNT(*) FROM leads WHERE user_id = users.id) != COALESCE(total_leads_received, 0)
ORDER BY actual DESC;

-- ============================================================================
-- 📋 IMPORTANT: Also need to update triggers!
-- ============================================================================
-- The trigger that increments counter should use user_id, not assigned_to
-- Run this separately after testing the counter fix
