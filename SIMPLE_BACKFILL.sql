-- ============================================================================
-- 🔧 SIMPLE BACKFILL (No Trigger Disable Needed)
-- ============================================================================
-- UPDATE queries normally don't fire INSERT triggers anyway

-- Step 1: Backfill NULL user_id values directly
UPDATE leads
SET user_id = assigned_to
WHERE user_id IS NULL AND assigned_to IS NOT NULL;

-- Step 2: Verify backfill success
SELECT 
    COUNT(*) as total_leads,
    COUNT(CASE WHEN user_id IS NULL AND assigned_to IS NOT NULL THEN 1 END) as still_null,
    COUNT(CASE WHEN user_id = assigned_to THEN 1 END) as synced,
    COUNT(CASE WHEN user_id != assigned_to THEN 1 END) as different
FROM leads;

-- Step 3: Recalculate ALL counters to match dashboard
UPDATE users 
SET total_leads_received = (
    SELECT COUNT(*) FROM leads WHERE leads.user_id = users.id
)
WHERE team_code IN ('TEAMFIRE', 'TEAMRAJ', 'GJ01TEAMFIRE');

-- Step 4: Verify all users synced
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
  AND is_active = true
ORDER BY actual DESC
LIMIT 10;

-- ============================================================================
-- ✅ EXPECTED RESULTS:
-- Step 2: still_null = 0, synced = 11,290+
-- Step 4: All users show ✅ SYNCED
-- ============================================================================
