-- ============================================================================
-- ✅ SIMPLE QUERY - Copy-Paste Into Supabase SQL Editor
-- ============================================================================

-- This single query will show EVERYTHING

SELECT 
    'Dashboard Method (user_id)' as method,
    COUNT(*) as lead_count
FROM leads
WHERE user_id = (SELECT id FROM users WHERE email = 'sharmahimanshu9797@gmail.com')

UNION ALL

SELECT 
    'Our Method (assigned_to)' as method,
    COUNT(*) as lead_count
FROM leads
WHERE assigned_to = (SELECT id FROM users WHERE email = 'sharmahimanshu9797@gmail.com');
