-- ============================================================================
-- 🔧 COMPLETE FIX WITH TRIGGER DISABLE
-- ============================================================================

-- Step 1: Disable the blocking trigger temporarily
ALTER TABLE leads DISABLE TRIGGER check_lead_limit_before_insert;

-- Step 2: Backfill NULL user_id values (639 leads)
UPDATE leads
SET user_id = assigned_to
WHERE user_id IS NULL AND assigned_to IS NOT NULL;

-- Step 3: Re-enable the trigger
ALTER TABLE leads ENABLE TRIGGER check_lead_limit_before_insert;

-- Step 4: Verify backfill success
SELECT 
    COUNT(*) as total_leads,
    COUNT(CASE WHEN user_id IS NULL AND assigned_to IS NOT NULL THEN 1 END) as still_null,
    COUNT(CASE WHEN user_id = assigned_to THEN 1 END) as synced,
    COUNT(CASE WHEN user_id != assigned_to THEN 1 END) as different
FROM leads;

-- Step 5: Recalculate ALL counters (match dashboard)
UPDATE users 
SET total_leads_received = (
    SELECT COUNT(*) FROM leads WHERE leads.user_id = users.id
)
WHERE team_code IN ('TEAMFIRE', 'TEAMRAJ', 'GJ01TEAMFIRE');

-- Step 6: Verify all users synced
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
LIMIT 20;

-- ============================================================================
-- ✅ EXPECTED RESULTS:
-- Step 4: still_null = 0, synced = 11,290+
-- Step 6: All users show ✅ SYNCED
-- ============================================================================
