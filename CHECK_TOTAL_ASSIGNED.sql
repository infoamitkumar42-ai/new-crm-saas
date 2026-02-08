-- ============================================================================
-- 📊 FINAL COUNT (ALL TIME) - FIXED SYNTAX
-- ============================================================================

SELECT 
    'Today' as time_period,
    COUNT(*) as leads_assigned
FROM leads 
WHERE assigned_at >= CURRENT_DATE

UNION ALL

SELECT 
    'All Time (Force Distributed)' as time_period,
    COUNT(*) as leads_assigned
FROM leads 
WHERE notes LIKE '%Force Distributed%'

UNION ALL

SELECT 
    'Jan Backlog (Force Distributed)' as time_period,
    COUNT(*) as leads_assigned
FROM leads 
WHERE notes LIKE '%Force Distributed%'
  AND created_at < CURRENT_DATE;
