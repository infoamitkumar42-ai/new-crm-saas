-- ============================================================================
-- 🔍 FIND ALL DUPLICATES: Gurnam & Sandeep (Last 2 Days)
-- ============================================================================

-- Find EXACT duplicate phone numbers (same number to both users)
SELECT 
    g.phone,
    g.name as gurnam_lead,
    g.city as gurnam_city,
    g.created_at as gurnam_date,
    s.name as sandeep_lead,
    s.city as sandeep_city,
    s.created_at as sandeep_date,
    g.id as gurnam_lead_id,
    s.id as sandeep_lead_id
FROM leads g
INNER JOIN leads s ON REPLACE(REPLACE(g.phone, '+', ''), ' ', '') = REPLACE(REPLACE(s.phone, '+', ''), ' ', '')
WHERE g.user_id = (SELECT id FROM users WHERE email = 'gurnambal01@gmail.com')
  AND s.user_id = (SELECT id FROM users WHERE email = 'sunnymehre451@gmail.com')
  AND g.created_at >= NOW() - INTERVAL '3 days'
  AND s.created_at >= NOW() - INTERVAL '3 days'
ORDER BY g.created_at DESC;

-- Count of duplicates
SELECT 
    'Total Duplicates Found' as check_type,
    COUNT(*) as count
FROM leads g
INNER JOIN leads s ON REPLACE(REPLACE(g.phone, '+', ''), ' ', '') = REPLACE(REPLACE(s.phone, '+', ''), ' ', '')
WHERE g.user_id = (SELECT id FROM users WHERE email = 'gurnambal01@gmail.com')
  AND s.user_id = (SELECT id FROM users WHERE email = 'sunnymehre451@gmail.com')
  AND g.created_at >= NOW() - INTERVAL '3 days'
  AND s.created_at >= NOW() - INTERVAL '3 days';
