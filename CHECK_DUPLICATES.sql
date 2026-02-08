-- ============================================================================
-- 🕵️ CHECK FOR DUPLICATE LEADS TODAY
-- ============================================================================
-- Checks if any phone numbers appear more than once among leads created today.

SELECT 
    phone,
    COUNT(*) as count,
    ARRAY_AGG(id) as lead_ids,
    ARRAY_AGG(assigned_to) as assigned_users,
    ARRAY_AGG(status) as statuses,
    ARRAY_AGG(created_at) as created_times
FROM leads
WHERE created_at >= CURRENT_DATE
GROUP BY phone
HAVING COUNT(*) > 1
ORDER BY count DESC;
