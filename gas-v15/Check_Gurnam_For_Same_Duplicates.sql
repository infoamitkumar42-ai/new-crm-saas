-- ============================================================================
-- 🔍 CHECK: Are Sandeep's duplicate numbers also in Gurnam's dashboard?
-- ============================================================================

-- Check these specific duplicate numbers in Gurnam's leads
SELECT 
    l.phone,
    l.name as lead_name,
    u.name as assigned_to,
    u.email,
    l.created_at
FROM leads l
JOIN users u ON l.user_id = u.id
WHERE u.email = 'gurnambal01@gmail.com'
  AND (
    l.phone LIKE '%7814023117%'
    OR l.phone LIKE '%8699216649%'
    OR l.phone LIKE '%8894114349%'
    OR l.phone LIKE '%9872795169%'
  )
ORDER BY l.phone;

-- Also check: ALL duplicate numbers in Gurnam's dashboard
SELECT 
    l.phone,
    COUNT(*) as times_assigned
FROM leads l
JOIN users u ON l.user_id = u.id
WHERE u.email = 'gurnambal01@gmail.com'
GROUP BY l.phone
HAVING COUNT(*) > 1
ORDER BY times_assigned DESC;
