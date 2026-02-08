-- ============================================================================
-- 🚨 URGENT QUOTA FIXES - Users with Multiple Payments
-- ============================================================================
-- Based on payment history analysis - 26 users need quota updates
-- ============================================================================

-- PRIORITY 1: Users with payments in last 3 days (MOST URGENT)
-- ============================================================================

-- Prabhjeet kaur - 2 payments × ₹1999 (TODAY!)
UPDATE users 
SET total_leads_promised = 200  -- 2 × 100 leads
WHERE email = 'kaurdeep06164@gmail.com';

-- Vinita punjabi - 2 payments × ₹1999 (1 day ago)
UPDATE users 
SET total_leads_promised = 200  -- 2 × 100 leads
WHERE email = 'punjabivinita@gmail.com';

-- Jashandeep Kaur - 2 payments × ₹999 (2 days ago)
UPDATE users 
SET total_leads_promised = 100  -- 2 × 50 leads
WHERE email = 'jashandeepkaur6444@gmail.com';

-- Jaspreet Kaur - ₹1999 + ₹999 (2 days ago)
UPDATE users 
SET total_leads_promised = 150  -- 100 + 50 leads
WHERE email = 'jaspreetkaursarao45@gmail.com';

-- PARAMJIT KAUR - 2 payments × ₹999 (2 days ago)
UPDATE users 
SET total_leads_promised = 100  -- 2 × 50 leads
WHERE email = 'paramjitkaur20890@gmail.com';

-- Payal - 2 payments × ₹1999 (2 days ago)
UPDATE users 
SET total_leads_promised = 200  -- 2 × 100 leads
WHERE email = 'payalpuri3299@gmail.com';

-- Preeti - 2 payments × ₹999 (2 days ago)
UPDATE users 
SET total_leads_promised = 100  -- 2 × 50 leads
WHERE email = 'preetibrarbrar7@gmail.com';

-- Rohit Kumar - ₹1999 + ₹999 (2 days ago)
UPDATE users 
SET total_leads_promised = 150  -- 100 + 50 leads
WHERE email = 'rohitgagneja69@gmail.com';

-- ranjodh singh - ₹1999 + ₹999 (2 days ago)
UPDATE users 
SET total_leads_promised = 150  -- 100 + 50 leads
WHERE email = 'ranjodhmomi@gmail.com';

-- Sonia Chauhan - ₹999 + ₹1999 (2 days ago)
UPDATE users 
SET total_leads_promised = 150  -- 50 + 100 leads
WHERE email = 's73481109@gmail.com';

-- VEERPAL KAUR - 2 payments × ₹1999 (2 days ago)
UPDATE users 
SET total_leads_promised = 200  -- 2 × 100 leads
WHERE email = 'surjitsingh1067@gmail.com';

-- PRIORITY 2: Users with payments 3-7 days ago
-- ============================================================================

-- Loveleen - 2 payments × ₹999 (3 days ago)
UPDATE users 
SET total_leads_promised = 100  -- 2 × 50 leads
WHERE email = 'loveleensharma530@gmail.com';

-- Rajinder - 2 payments × ₹1999 (3 days ago)
UPDATE users 
SET total_leads_promised = 200  -- 2 × 100 leads
WHERE email = 'officialrajinderdhillon@gmail.com';

-- Ravenjeet Kaur - 2 payments × ₹1999 (3 days ago)
UPDATE users 
SET total_leads_promised = 200  -- 2 × 100 leads
WHERE email = 'ravenjeetkaur@gmail.com';

-- Mandeep kaur - 3 payments (₹1999 + ₹999 + ₹1999) (4 days ago)
UPDATE users 
SET total_leads_promised = 250  -- 100 + 50 + 100 leads
WHERE email = 'mandeepbrar1325@gmail.com';

-- Saloni - 3 payments (₹1999 + ₹999 + ₹999) (5 days ago)
UPDATE users 
SET total_leads_promised = 200  -- 100 + 50 + 50 leads
WHERE email = 'ananyakakkar53b@gmail.com';

-- PRIORITY 3: Users with payments 10-15 days ago
-- ============================================================================

-- Babita - 2 payments × ₹999 (10 days ago)
UPDATE users 
SET total_leads_promised = 100  -- 2 × 50 leads
WHERE email = 'babitanahar5@gmail.com';

-- SAMAN - 2 payments × ₹1999 (11 days ago)
UPDATE users 
SET total_leads_promised = 200  -- 2 × 100 leads
WHERE email = 'samandeepkaur1216@gmail.com';

-- Ajay kumar - 2 captured payments × ₹1999 (12 & 29 days ago, ignore refunded)
UPDATE users 
SET total_leads_promised = 200  -- 2 × 100 leads
WHERE email = 'ajayk783382@gmail.com';

-- Tushte - 2 payments × ₹999 (8 days ago)
UPDATE users 
SET total_leads_promised = 100  -- 2 × 50 leads
WHERE email = 'tushte756@gmail.com';

-- Suman - 2 payments × ₹999 (15 days ago)
UPDATE users 
SET total_leads_promised = 100  -- 2 × 50 leads
WHERE email = 'sumansumankaur09@gmail.com';

-- PRIORITY 4: Older renewals (28-31 days ago)
-- ============================================================================

-- Jasdeep Kaur - 2 payments × ₹999 (3 & 29 days ago)
UPDATE users 
SET total_leads_promised = 100  -- 2 × 50 leads
WHERE email = 'jasdeepsra68@gmail.com';

-- Jashandeep kaur (jk419473) - 2 payments × ₹2499 (3 & 31 days ago)
UPDATE users 
SET total_leads_promised = 300  -- 2 × 150 leads (₹2499 = supervisor plan)
WHERE email = 'jk419473@gmail.com';

-- Navpreet kaur - 2 payments × ₹1999 (2 & 31 days ago)
UPDATE users 
SET total_leads_promised = 200  -- 2 × 100 leads
WHERE email = 'navpreetkaur95271@gmail.com';

-- Nazia Begam - 2 payments × ₹1999 (2 & 25 days ago)
UPDATE users 
SET total_leads_promised = 200  -- 2 × 100 leads
WHERE email = 'ziana4383@gmail.com';

-- ============================================================================
-- VERIFICATION QUERY - Run after updates
-- ============================================================================

SELECT 
    name,
    email,
    total_leads_received as received,
    total_leads_promised as new_quota,
    total_leads_received - total_leads_promised as remaining,
    CASE 
        WHEN total_leads_received < total_leads_promised THEN '✅ UNBLOCKED'
        ELSE '🔴 STILL BLOCKED'
    END as status
FROM users
WHERE email IN (
    'kaurdeep06164@gmail.com',
    'punjabivinita@gmail.com',
    'jashandeepkaur6444@gmail.com',
    'jaspreetkaursarao45@gmail.com',
    'paramjitkaur20890@gmail.com',
    'payalpuri3299@gmail.com',
    'preetibrarbrar7@gmail.com',
    'rohitgagneja69@gmail.com',
    'ranjodhmomi@gmail.com',
    's73481109@gmail.com',
    'surjitsingh1067@gmail.com',
    'loveleensharma530@gmail.com',
    'officialrajinderdhillon@gmail.com',
    'ravenjeetkaur@gmail.com',
    'mandeepbrar1325@gmail.com',
    'ananyakakkar53b@gmail.com',
    'babitanahar5@gmail.com',
    'samandeepkaur1216@gmail.com',
    'ajayk783382@gmail.com',
    'tushte756@gmail.com',
    'sumansumankaur09@gmail.com',
    'jasdeepsra68@gmail.com',
    'jk419473@gmail.com',
    'navpreetkaur95271@gmail.com',
    'ziana4383@gmail.com'
)
ORDER BY status DESC, name;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- 25 users updated with correct quotas based on multiple payments
-- All should be UNBLOCKED after these updates
-- RPC will automatically allow them to receive leads again
-- ============================================================================
