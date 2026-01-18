-- ============================================================================
-- EXTEND PLAN: 6 Users Expired on Jan 16, 2026
-- Extension: +7 Days (Jan 16 → Jan 23, 2026)
-- ============================================================================

-- Update valid_until for 6 expired users
UPDATE users
SET 
    valid_until = '2026-01-23 23:59:59'::timestamptz,
    updated_at = NOW()
WHERE email IN (
    'jk419473@gmail.com',           -- Jashandeep kaur (turbo_boost)
    'rrai26597@gmail.com',          -- Rahul Rai (weekly_boost)
    'palakgharu2025@gmail.com',     -- Palak (weekly_boost)
    'navpreetkaur95271@gmail.com',  -- Navpreet kaur (weekly_boost)
    'brark5763@gmail.com',          -- Kiran Brar (weekly_boost)
    'sy390588@gmail.com'            -- Sneha (weekly_boost)
)
RETURNING name, email, plan_name, valid_until;

-- Verify the update
SELECT 
    name,
    email,
    plan_name,
    valid_until,
    CASE 
        WHEN valid_until > NOW() THEN '✅ Active'
        ELSE '❌ Expired'
    END as status,
    EXTRACT(DAY FROM (valid_until - NOW())) as days_remaining
FROM users
WHERE email IN (
    'jk419473@gmail.com',
    'rrai26597@gmail.com',
    'palakgharu2025@gmail.com',
    'navpreetkaur95271@gmail.com',
    'brark5763@gmail.com',
    'sy390588@gmail.com'
)
ORDER BY name;
