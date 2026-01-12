-- ============================================================================
-- 📲 CHECK PUSH SUBSCRIPTION STATUS
-- ============================================================================

SELECT 
    u.name, 
    u.email, 
    u.id as user_id, 
    COUNT(s.id) as device_count,
    MAX(s.created_at) as last_subscribed_at
FROM users u
LEFT JOIN push_subscriptions s ON u.id = s.user_id
WHERE u.email IN (
    'dbrar8826@gmail.com',         -- Akash
    'chouhansab64@gmail.com',      -- Rimpy
    'sunnymehre451@gmail.com',     -- Sandeep
    'workwithrajwinder@gmail.com'  -- Rajwinder
)
GROUP BY u.name, u.email, u.id
ORDER BY device_count ASC;
