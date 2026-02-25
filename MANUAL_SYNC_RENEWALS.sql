-- ============================================================================
-- 🚀 MANUAL SYNC RENEWALS (ARSH & KULWANT)
-- ============================================================================

BEGIN;

-- 1. Sync Arshdeep Kaur (+200 lead quota for renewal)
UPDATE users 
SET 
    total_leads_promised = total_leads_promised + 200,
    is_active = true,
    updated_at = NOW()
WHERE email = 'arshkaur6395@gmail.com';

-- 2. Sync Kulwant Singh (+200 lead quota for renewal)
UPDATE users 
SET 
    total_leads_promised = total_leads_promised + 200,
    is_active = true,
    updated_at = NOW()
WHERE email = 'kulwantsinghdhaliwalsaab668@gmail.com';

COMMIT;

-- VERIFICATION
SELECT name, email, total_leads_promised, total_leads_received, is_active
FROM users
WHERE email IN ('arshkaur6395@gmail.com', 'kulwantsinghdhaliwalsaab668@gmail.com');
