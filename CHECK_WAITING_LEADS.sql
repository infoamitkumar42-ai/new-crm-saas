-- ============================================================================
-- ✅ SIMPLE CHECK: Are Leads Waiting for 8 AM?
-- ============================================================================

-- Check 1: How many leads waiting (unassigned today)
SELECT 
    COUNT(*) as waiting_leads,
    MIN(created_at) as oldest_waiting,
    MAX(created_at) as newest_waiting,
    STRING_AGG(DISTINCT source, ', ') as sources
FROM leads
WHERE created_at >= CURRENT_DATE
  AND assigned_to IS NULL;

-- Check 2: Sample of waiting leads
SELECT 
    name,
    phone,
    city,
    source,
    TO_CHAR(created_at, 'HH24:MI:SS') as time_received,
    EXTRACT(EPOCH FROM (NOW() - created_at)) / 60 as minutes_waiting
FROM leads
WHERE created_at >= CURRENT_DATE
  AND assigned_to IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- Check 3: How many users are active and eligible?
SELECT 
    COUNT(*) as total_active,
    COUNT(CASE WHEN total_leads_received < total_leads_promised OR total_leads_promised IS NULL OR total_leads_promised = 0 THEN 1 END) as has_quota,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active
FROM users
WHERE team_code IN ('TEAMFIRE', 'TEAMRAJ', 'GJ01TEAMFIRE');

-- ============================================================================
-- Expected: ~26 leads waiting, will assign at 8:00 AM
-- ============================================================================
