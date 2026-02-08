-- ============================================================================
-- 🕵️ CHECK DETAILED ORIGIN & VISIBILITY
-- ============================================================================

-- Query 1: When were these leads created? (Date & Hour)
SELECT 
    DATE(created_at) as created_date,
    EXTRACT(HOUR FROM created_at) as created_hour,
    source,
    COUNT(*) as count
FROM leads
WHERE notes LIKE '%Force Distributed%'
GROUP BY 1, 2, 3
ORDER BY 1 DESC, 2 DESC;

-- Query 2: Are they visible in Dashboard? (Check user_id)
-- Dashboard shows leads where user_id = current_user
SELECT 
    COUNT(*) as total_force_distributed,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as visible_in_dashboard,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as NOT_VISIBLE_IN_DASHBOARD,
    COUNT(CASE WHEN user_id = assigned_to THEN 1 END) as synced_correctly
FROM leads
WHERE notes LIKE '%Force Distributed%';

-- Query 3: Sample details
SELECT 
    id,
    created_at,
    name, 
    source,
    assigned_to, 
    user_id -- Critical Column for Dashboard
FROM leads
WHERE notes LIKE '%Force Distributed%'
LIMIT 10;
