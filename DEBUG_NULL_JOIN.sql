-- ============================================================================
-- 🕵️ DEBUG NULL ASSIGNMENTS
-- ============================================================================

-- 1. Check a few recent "Assigned" leads to see which ID column is populated
SELECT 
    id, 
    name, 
    status, 
    user_id, 
    assigned_to, 
    created_at
FROM leads 
WHERE status = 'Assigned' 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Check if the IDs in those columns actually exist in the users table
SELECT id, name FROM users LIMIT 5;
