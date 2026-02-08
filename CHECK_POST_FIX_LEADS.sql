-- ============================================================================
-- 🕵️ CHECK POST-FIX LEADS (Last 30 Mins)
-- ============================================================================

-- 1. Are there any leads WAITING right now?
SELECT 
    COUNT(*) as waiting_leads_count,
    STRING_AGG(source, ', ') as waiting_sources
FROM leads 
WHERE assigned_to IS NULL 
  AND created_at >= CURRENT_DATE;

-- 2. Did any NEW lead come AFTER our fix (9:05 AM IST approx)?
-- (Checking last 30 mins)
SELECT 
    id,
    name,
    source,
    created_at,
    assigned_to,
    (SELECT name FROM users WHERE id = assigned_to) as assigned_user,
    status,
    notes
FROM leads
WHERE created_at >= NOW() - INTERVAL '30 minutes'
ORDER BY created_at DESC;

-- 3. Check System Health (Can we assign right now?)
-- Try to find a user for both teams
SELECT 'GJ01TEAMFIRE' as team, user_id as best_candidate FROM get_best_assignee_for_team('GJ01TEAMFIRE')
UNION ALL
SELECT 'TEAMFIRE' as team, user_id as best_candidate FROM get_best_assignee_for_team('TEAMFIRE');
