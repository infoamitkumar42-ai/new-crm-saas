-- ============================================================================
-- 🚀 INCREASE QUOTAS FOR FEB PAID USERS
-- ============================================================================

BEGIN;

-- 1. Navjot Kaur (Paid ₹999 on Feb 9 -> Add 115 Leads)
-- Current promised: 115, Next: 230
UPDATE users 
SET 
    total_leads_promised = 230,
    daily_limit = 5,
    is_active = true,
    updated_at = NOW()
WHERE email = 'knavjotkaur113@gmail.com';

-- 2. Gurpreet kaur (Paid ₹999 on Feb 10 -> Add 115 Leads)
-- Current promised: 92, Next: 207 (Keeping it consistent with 115 addition)
UPDATE users 
SET 
    total_leads_promised = total_leads_promised + 115,
    daily_limit = 5,
    is_active = true,
    updated_at = NOW()
WHERE email = 'gjama1979@gmail.com';

-- 3. Swati (Paid ₹1999 on Feb 11 -> Add 230 Leads)
-- Current promised: 115 (based on previous scan), Next: 345
UPDATE users 
SET 
    total_leads_promised = 345,
    daily_limit = 7,
    is_active = true,
    updated_at = NOW()
WHERE email = 'sainsachin737@gmail.com';

-- 4. Manbir Singh (Paid ₹1999 on Feb 12 -> Add 230 Leads)
-- Current promised: 115, Next: 345
UPDATE users 
SET 
    total_leads_promised = 345,
    daily_limit = 7,
    is_active = true,
    updated_at = NOW()
WHERE email = 'singhmanbir938@gmail.com';

COMMIT;

-- VERIFICATION
SELECT name, email, plan_name, total_leads_promised, total_leads_received, daily_limit
FROM users
WHERE email IN (
    'knavjotkaur113@gmail.com',
    'gjama1979@gmail.com',
    'sainsachin737@gmail.com',
    'singhmanbir938@gmail.com'
);
