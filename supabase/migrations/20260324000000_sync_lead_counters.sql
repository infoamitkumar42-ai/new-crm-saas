-- ============================================================================
-- SQL Script: Synchronize Lead Counters (Historical Fix)
-- ============================================================================
-- Run this script in the Supabase SQL Editor to fix existing inflated counters.
-- It recalculates total_leads_received based on actual entries in the leads table.
-- ============================================================================

UPDATE users u
SET total_leads_received = (
    SELECT COUNT(*) 
    FROM leads l 
    WHERE (l.assigned_to = u.id OR l.user_id = u.id)
    AND l.created_at >= COALESCE(u.plan_start_date, '2020-01-01')
    AND l.status NOT IN ('Invalid', 'Duplicate', 'Night_Backlog', 'Queued')
)
WHERE u.role = 'member' AND (u.is_active = true OR u.plan_name != 'none');

-- Optional: Verify the counts after update
SELECT name, email, total_leads_received, 
       (SELECT COUNT(*) FROM leads WHERE (assigned_to = users.id OR user_id = users.id) AND status = 'Assigned') as actual_assigned
FROM users
WHERE role = 'member'
ORDER BY total_leads_received DESC;
