-- ============================================================================
-- 🔍 SIMPLE CHECK: Duplicates between Gurnam & Sandeep
-- ============================================================================

-- Check if ANY duplicates exist
SELECT 
    'Duplicate Count' as check_type,
    COUNT(*) as count
FROM (
    SELECT l.phone FROM leads l 
    JOIN users u ON l.user_id = u.id 
    WHERE u.email = 'gurnambal01@gmail.com'
) gurnam_leads
INNER JOIN (
    SELECT l.phone FROM leads l 
    JOIN users u ON l.user_id = u.id 
    WHERE u.email = 'sunnymehre451@gmail.com'
) sandeep_leads
ON gurnam_leads.phone = sandeep_leads.phone;

-- Show both user's total leads
SELECT 'Gurnam' as user_name, COUNT(*) as total_leads 
FROM leads l JOIN users u ON l.user_id = u.id 
WHERE u.email = 'gurnambal01@gmail.com'
UNION ALL
SELECT 'Sandeep' as user_name, COUNT(*) as total_leads 
FROM leads l JOIN users u ON l.user_id = u.id 
WHERE u.email = 'sunnymehre451@gmail.com';
