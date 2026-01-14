-- ============================================================================
-- 🗑️ REMOVE DUPLICATE LEADS FROM SANDEEP'S DASHBOARD
-- Keeps the OLDEST entry, removes the NEWER duplicate
-- ============================================================================

-- Step 1: See duplicates that will be deleted (PREVIEW)
SELECT 
    id,
    phone,
    name,
    created_at,
    'WILL BE DELETED' as action
FROM leads
WHERE id IN (
    SELECT l2.id
    FROM leads l1
    JOIN leads l2 ON l1.phone = l2.phone 
                  AND l1.user_id = l2.user_id 
                  AND l1.created_at < l2.created_at
    WHERE l1.user_id = (SELECT id FROM users WHERE email = 'sunnymehre451@gmail.com')
)
ORDER BY phone, created_at;

-- Step 2: DELETE duplicates (uncomment to execute)
-- DELETE FROM leads
-- WHERE id IN (
--     SELECT l2.id
--     FROM leads l1
--     JOIN leads l2 ON l1.phone = l2.phone 
--                   AND l1.user_id = l2.user_id 
--                   AND l1.created_at < l2.created_at
--     WHERE l1.user_id = (SELECT id FROM users WHERE email = 'sunnymehre451@gmail.com')
-- );

-- Step 3: Update Sandeep's lead counter after deletion
-- UPDATE users SET leads_today = leads_today - [NUMBER_OF_DELETED] 
-- WHERE email = 'sunnymehre451@gmail.com';
