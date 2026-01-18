-- MASTER SCRIPT: Delete old leads + Distribute remaining to active users

-- ============================================
-- STEP 1: DELETE 82 VERY OLD LEADS (Before Jan 10)
-- ============================================
DELETE FROM leads 
WHERE created_at < '2026-01-10 00:00:00'
AND status IN ('New', 'Night_Backlog', 'Assigned');

-- Verify deletion
SELECT 'Old leads deleted. Remaining before Jan 10:' as Status, COUNT(*) as Count
FROM leads WHERE created_at < '2026-01-10 00:00:00';

-- ============================================
-- STEP 2: GET ALL ACTIVE USERS
-- ============================================
SELECT id, name, email, daily_limit, leads_today
FROM users 
WHERE is_active = true 
AND role IN ('member', 'manager')
AND daily_limit > 0
ORDER BY leads_today ASC;

-- ============================================
-- STEP 3: COUNT UNASSIGNED LEADS (Jan 14 onwards)
-- ============================================
SELECT 'Total Unassigned Leads (Jan 14+):' as Info, COUNT(*) as Count
FROM leads 
WHERE assigned_to IS NULL 
AND status IN ('New', 'Night_Backlog')
AND created_at >= '2026-01-14 00:00:00';

-- ============================================
-- STEP 4: BULK ASSIGN TO ALL ACTIVE USERS (Round Robin)
-- This will distribute leads equally
-- ============================================

-- Create temp table with row numbers for distribution
WITH active_users AS (
    SELECT id, name, ROW_NUMBER() OVER (ORDER BY leads_today ASC, id) - 1 as user_index
    FROM users 
    WHERE is_active = true 
    AND role IN ('member', 'manager')
    AND daily_limit > 0
),
unassigned_leads AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) - 1 as lead_index
    FROM leads 
    WHERE assigned_to IS NULL 
    AND status IN ('New', 'Night_Backlog')
    AND created_at >= '2026-01-14 00:00:00'
),
user_count AS (
    SELECT COUNT(*) as total FROM active_users
)
UPDATE leads l
SET 
    assigned_to = (
        SELECT u.id 
        FROM active_users u, unassigned_leads ul, user_count uc
        WHERE ul.id = l.id 
        AND u.user_index = (ul.lead_index % uc.total)
    ),
    user_id = (
        SELECT u.id 
        FROM active_users u, unassigned_leads ul, user_count uc
        WHERE ul.id = l.id 
        AND u.user_index = (ul.lead_index % uc.total)
    ),
    status = 'Assigned',
    assigned_at = NOW()
WHERE l.id IN (SELECT id FROM unassigned_leads);

-- ============================================
-- STEP 5: VERIFY DISTRIBUTION
-- ============================================
SELECT 
    u.name,
    u.email,
    COUNT(l.id) as new_leads_assigned
FROM users u
LEFT JOIN leads l ON l.assigned_to = u.id AND l.assigned_at >= NOW() - INTERVAL '5 minutes'
WHERE u.is_active = true AND u.role IN ('member', 'manager')
GROUP BY u.name, u.email
ORDER BY new_leads_assigned DESC;
