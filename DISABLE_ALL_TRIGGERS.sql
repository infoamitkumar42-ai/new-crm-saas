-- ============================================================================
-- 🔥 NUCLEAR OPTION: Disable ALL Triggers and Backfill
-- ============================================================================

-- Step 1: Disable ALL triggers on leads table
ALTER TABLE leads DISABLE TRIGGER ALL;

-- Step 2: Backfill NULL user_id values
UPDATE leads
SET user_id = assigned_to
WHERE user_id IS NULL AND assigned_to IS NOT NULL;

-- Step 3: Re-enable ALL triggers
ALTER TABLE leads ENABLE TRIGGER ALL;

-- Step 4: Verify backfill
SELECT 
    COUNT(*) as total_leads,
    COUNT(CASE WHEN user_id IS NULL AND assigned_to IS NOT NULL THEN 1 END) as still_null,
    COUNT(CASE WHEN user_id = assigned_to THEN 1 END) as synced
FROM leads;

-- Step 5: Recalculate counters
UPDATE users 
SET total_leads_received = (
    SELECT COUNT(*) FROM leads WHERE leads.user_id = users.id
)
WHERE team_code IN ('TEAMFIRE', 'TEAMRAJ', 'GJ01TEAMFIRE');

-- Step 6: Verify sync
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
