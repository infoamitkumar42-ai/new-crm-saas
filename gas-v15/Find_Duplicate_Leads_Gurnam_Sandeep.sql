-- ============================================================================
-- 🔍 FIND DUPLICATE LEADS: Gurnam & Sandeep (Same Phone Numbers)
-- ============================================================================

-- Step 1: Find exact duplicate phone numbers between both users
SELECT 
    g.phone,
    g.name as gurnam_lead_name,
    s.name as sandeep_lead_name,
    g.city as gurnam_city,
    s.city as sandeep_city,
    g.id as gurnam_lead_id,
    s.id as sandeep_lead_id
FROM leads g
JOIN leads s ON g.phone = s.phone
JOIN users ug ON g.user_id = ug.id
JOIN users us ON s.user_id = us.id
WHERE ug.email = 'gurnambal01@gmail.com'
  AND us.email = 'sunnymehre451@gmail.com'
  AND g.id != s.id;

-- Step 2: Count total duplicates
SELECT 
    COUNT(*) as total_duplicate_leads
FROM leads g
JOIN leads s ON g.phone = s.phone
JOIN users ug ON g.user_id = ug.id
JOIN users us ON s.user_id = us.id
WHERE ug.email = 'gurnambal01@gmail.com'
  AND us.email = 'sunnymehre451@gmail.com'
  AND g.id != s.id;

-- Step 3: Show Gurnam's leads count
SELECT 'Gurnam' as user_name, COUNT(*) as total_leads 
FROM leads l 
JOIN users u ON l.user_id = u.id 
WHERE u.email = 'gurnambal01@gmail.com';

-- Step 4: Show Sandeep's leads count
SELECT 'Sandeep' as user_name, COUNT(*) as total_leads 
FROM leads l 
JOIN users u ON l.user_id = u.id 
WHERE u.email = 'sunnymehre451@gmail.com';
