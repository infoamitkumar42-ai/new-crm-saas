-- ============================================================================
-- 🕵️‍♂️ WHY ARE THEY HUNGRY? (Pending Leads Analysis - Fixed)
-- ============================================================================

SELECT 
    l.city,
    l.state,
    -- Removed gender as column doesn't exist
    COUNT(*) as count
FROM leads l
WHERE l.status = 'New' 
AND l.user_id IS NULL
GROUP BY l.city, l.state
ORDER BY count DESC;
