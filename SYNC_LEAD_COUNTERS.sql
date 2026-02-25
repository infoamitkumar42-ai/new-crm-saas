-- ============================================================================
-- 🔄 SYNC LEAD COUNTERS (leads_today) - PHASE 80
-- ============================================================================

BEGIN;

-- 1. Create a CTE to calculate actual lead counts for today
WITH actual_counts AS (
    SELECT 
        assigned_to as user_id,
        COUNT(*) as real_count
    FROM leads
    WHERE assigned_to IS NOT NULL
      AND created_at >= CURRENT_DATE::timestamp
    GROUP BY assigned_to
)
-- 2. Update the users table based on the CTE
UPDATE users u
SET leads_today = ac.real_count
FROM actual_counts ac
WHERE u.id = ac.user_id;

-- 3. Reset users who have 0 leads today (in case they were manually set to high numbers)
UPDATE users
SET leads_today = 0
WHERE id NOT IN (
    SELECT DISTINCT assigned_to 
    FROM leads 
    WHERE assigned_to IS NOT NULL 
      AND created_at >= CURRENT_DATE::timestamp
);

COMMIT;

-- VERIFICATION
SELECT name, email, leads_today, daily_limit
FROM users
WHERE email ILIKE 'jashandeepkaur6444@gmail.com';
