-- ============================================================================
-- PART 1: STUCK LEADS AGE ANALYSIS
-- ============================================================================
SELECT 
    DATE_TRUNC('hour', assigned_at) as time_assigned,
    COUNT(*) as lead_count,
    STRING_AGG(DISTINCT (SELECT name FROM users WHERE id = user_id), ', ') as managers_holding
FROM leads 
WHERE status = 'Assigned' 
  AND assigned_at < NOW() - INTERVAL '1 day'
GROUP BY 1
ORDER BY 1 DESC;

-- ============================================================================
-- PART 2: THE FIX (ROLLBACK & SYNC)
-- ============================================================================
-- A. Move these 158 stuck leads back to "New" pool so they can be redistributed
UPDATE leads 
SET user_id = NULL, status = 'New', assigned_at = NULL 
WHERE status = 'Assigned' AND assigned_at < NOW() - INTERVAL '1 day';

-- B. Sync the 'leads_today' column with actual database records
-- This fixes the Dashboard counts and negative pending quotas
UPDATE users u
SET leads_today = (
    SELECT COUNT(*) FROM leads l 
    WHERE l.user_id = u.id 
      AND l.assigned_at >= CURRENT_DATE
);

-- C. Final Confirmation
SELECT 
    COUNT(*) as total_stuck_remaining,
    (SELECT COUNT(*) FROM leads WHERE status = 'New') as total_new_pool
FROM leads;
