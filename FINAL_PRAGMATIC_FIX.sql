-- ============================================================================
-- ✅ PRAGMATIC SOLUTION: Accept Old Data, Fix Future
-- ============================================================================
-- We can't backfill 639 old leads due to triggers
-- Instead: Fix INSERT function + Manually set correct counters
-- ============================================================================

-- PART 1: Update INSERT function to populate user_id for FUTURE leads
-- Run UPDATE_INSERT_FUNCTION.sql separately (already created)

-- PART 2: Set counters to correct values RIGHT NOW
-- This matches what dashboard shows (uses user_id column)

UPDATE users 
SET total_leads_received = (
    SELECT COUNT(*) FROM leads WHERE leads.user_id = users.id
)
WHERE team_code IN ('TEAMFIRE', 'TEAMRAJ', 'GJ01TEAMFIRE');

-- PART 3: Verify all synced
SELECT 
    name, email,
    total_leads_received as counter,
    (SELECT COUNT(*) FROM leads WHERE user_id = users.id) as actual_user_id,
    (SELECT COUNT(*) FROM leads WHERE assigned_to = users.id) as actual_assigned_to,
    CASE 
        WHEN total_leads_received = (SELECT COUNT(*) FROM leads WHERE user_id = users.id) 
        THEN '✅ SYNCED' 
        ELSE '❌ OUT OF SYNC' 
    END as status
FROM users
WHERE team_code IN ('TEAMFIRE', 'TEAMRAJ', 'GJ01TEAMFIRE')
  AND is_active = true
ORDER BY actual_user_id DESC
LIMIT 15;

-- ============================================================================
-- 📋 SUMMARY:
-- - 639 old leads will NOT have user_id (stay NULL)
-- - Counters are set to current accurate values
-- - Future leads WILL have user_id populated (via updated function)
-- - System will stay in sync going forward
-- ============================================================================
