-- ============================================================================
-- 🚀 CHIRAG TEAM PLAN EXTENSIONS & UPGRADES
-- ============================================================================

BEGIN;

-- 1. EXTEND EXPIRED USERS BY 2 DAYS
-- Only targets users in Chirag's team who are currently expired
UPDATE users
SET 
    valid_until = NOW() + INTERVAL '2 days',
    is_active = true,
    updated_at = NOW()
WHERE team_code = 'GJ01TEAMFIRE'
  AND (valid_until < NOW() OR valid_until IS NULL)
  AND email != 'kaushalrathod2113@gmail.com'; -- Exclude Kaushal for special handling

-- 2. UPGRADE KAUSHAL RATHOD (Turbo Boost + 10 Days)
-- Set to Turbo Boost, 10 days from now, and ensure active
UPDATE users
SET 
    plan_name = 'turbo_boost',
    valid_until = NOW() + INTERVAL '10 days',
    total_leads_promised = 500, -- Standard Turbo quota
    is_active = true,
    updated_at = NOW()
WHERE email = 'kaushalrathod2113@gmail.com';

COMMIT;

-- VERIFICATION
SELECT name, email, plan_name, valid_until, is_active, total_leads_promised
FROM users
WHERE team_code = 'GJ01TEAMFIRE'
  AND (email = 'kaushalrathod2113@gmail.com' OR updated_at > NOW() - INTERVAL '1 minute');
