-- ============================================================================
-- 🔍 HIMANSHU LEAD INVESTIGATION - Find Missing 72 Leads
-- ============================================================================
-- Dashboard shows: 209
-- Database showed: 137
-- Missing: 72 leads
-- ============================================================================

-- Query 1: Current Counter Status
SELECT 
    name,
    email,
    total_leads_received as counter,
    total_leads_promised as quota,
    leads_today,
    is_active,
    is_online
FROM users
WHERE email = 'sharmahimanshu9797@gmail.com';

-- Query 2: Actual Lead Count
SELECT COUNT(*) as actual_leads_in_database
FROM leads
WHERE assigned_to = (SELECT id FROM users WHERE email = 'sharmahimanshu9797@gmail.com');

-- Query 3: Check for Multiple Himanshu Accounts
SELECT 
    id,
    name,
    email,
    team_code,
    total_leads_received,
    (SELECT COUNT(*) FROM leads WHERE assigned_to = users.id) as actual_count
FROM users
WHERE name ILIKE '%himanshu%' OR email ILIKE '%himanshu%'
ORDER BY total_leads_received DESC;

-- Query 4: Total Leads Across All Himanshu Accounts
SELECT 
    SUM(total_leads_received) as sum_of_counters,
    SUM((SELECT COUNT(*) FROM leads WHERE assigned_to = users.id)) as sum_of_actual
FROM users
WHERE name ILIKE '%himanshu%' OR email ILIKE '%himanshu%';

-- Query 5: Check All User Columns (Find Hidden Lead Fields)
\d users

-- Alternative Query 5: Show full user record
SELECT *
FROM users
WHERE email = 'sharmahimanshu9797@gmail.com';
