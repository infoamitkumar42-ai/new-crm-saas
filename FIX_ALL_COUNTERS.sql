-- ============================================================================
-- 🔧 FIX ALL COUNTER SYNC ISSUES
-- ============================================================================
-- This will update total_leads_received to match actual lead counts
-- for all users in TEAMFIRE, TEAMRAJ, and GJ01TEAMFIRE
-- ============================================================================

-- Step 1: Show current sync status
SELECT 
    name,
    email,
    total_leads_received as counter,
    (SELECT COUNT(*) FROM leads WHERE assigned_to = users.id) as actual,
    (SELECT COUNT(*) FROM leads WHERE assigned_to = users.id) - COALESCE(total_leads_received, 0) as difference
FROM users
WHERE team_code IN ('TEAMFIRE', 'TEAMRAJ', 'GJ01TEAMFIRE')
  AND (SELECT COUNT(*) FROM leads WHERE assigned_to = users.id) != COALESCE(total_leads_received, 0)
ORDER BY difference DESC
LIMIT 20;

-- Step 2: Fix all counters
UPDATE users 
SET total_leads_received = (
    SELECT COUNT(*) 
    FROM leads 
    WHERE leads.assigned_to = users.id
)
WHERE team_code IN ('TEAMFIRE', 'TEAMRAJ', 'GJ01TEAMFIRE');

-- Step 3: Verify fix - Should return 0 rows if all synced
SELECT 
    name,
    email,
    total_leads_received as counter,
    (SELECT COUNT(*) FROM leads WHERE assigned_to = users.id) as actual,
    CASE 
        WHEN total_leads_received = (SELECT COUNT(*) FROM leads WHERE assigned_to = users.id) 
        THEN '✅ SYNCED' 
        ELSE '❌ STILL OUT OF SYNC' 
    END as status
FROM users
WHERE team_code IN ('TEAMFIRE', 'TEAMRAJ', 'GJ01TEAMFIRE')
  AND (SELECT COUNT(*) FROM leads WHERE assigned_to = users.id) != COALESCE(total_leads_received, 0)
ORDER BY actual DESC;

-- Step 4: Summary statistics
SELECT 
    COUNT(*) as total_users,
    SUM((SELECT COUNT(*) FROM leads WHERE assigned_to = users.id)) as total_leads,
    AVG((SELECT COUNT(*) FROM leads WHERE assigned_to = users.id)) as avg_leads_per_user,
    MAX((SELECT COUNT(*) FROM leads WHERE assigned_to = users.id)) as max_leads,
    MIN((SELECT COUNT(*) FROM leads WHERE assigned_to = users.id)) as min_leads
FROM users
WHERE team_code IN ('TEAMFIRE', 'TEAMRAJ', 'GJ01TEAMFIRE')
  AND is_active = true;
