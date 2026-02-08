-- ============================================================================
-- 🔥 CRITICAL DISCOVERY: Dashboard uses user_id, not assigned_to!
-- ============================================================================

-- Query 1: Check leads table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leads' 
  AND (column_name LIKE '%user%' OR column_name LIKE '%assign%')
ORDER BY ordinal_position;

-- Query 2: Count Himanshu's leads using user_id (DASHBOARD METHOD)
SELECT COUNT(*) as count_by_user_id
FROM leads
WHERE user_id = (SELECT id FROM users WHERE email = 'sharmahimanshu9797@gmail.com');

-- Query 3: Count Himanshu's leads using assigned_to (OUR METHOD)
SELECT COUNT(*) as count_by_assigned_to
FROM leads
WHERE assigned_to = (SELECT id FROM users WHERE email = 'sharmahimanshu9797@gmail.com');

-- Query 4: COMPARE both columns
SELECT 
    (SELECT COUNT(*) FROM leads WHERE user_id = (SELECT id FROM users WHERE email = 'sharmahimanshu9797@gmail.com')) as user_id_count,
    (SELECT COUNT(*) FROM leads WHERE assigned_to = (SELECT id FROM users WHERE email = 'sharmahimanshu9797@gmail.com')) as assigned_to_count;

-- Query 5: Check if user_id and assigned_to are different
SELECT 
    COUNT(CASE WHEN user_id != assigned_to THEN 1 END) as mismatch_count,
    COUNT(*) as total_rows
FROM leads
WHERE user_id IS NOT NULL OR assigned_to IS NOT NULL;
