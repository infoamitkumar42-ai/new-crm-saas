-- ============================================================================
-- 🚀 REVERT CHIRAG TEAM NON-BOOSTER EXTENSIONS
-- ============================================================================

BEGIN;

-- 1. REVERT STARTER AND NONE PLANS TO EXPIRED/INACTIVE
-- Only targets non-booster users who were extended today
UPDATE users
SET 
    valid_until = NOW() - INTERVAL '1 day',
    is_active = false,
    updated_at = NOW()
WHERE team_code = 'GJ01TEAMFIRE'
  AND plan_name IN ('starter', 'none')
  AND valid_until > NOW();

COMMIT;

-- VERIFICATION: Only Booster plans should be active now
SELECT name, email, plan_name, valid_until, is_active
FROM users
WHERE team_code = 'GJ01TEAMFIRE'
  AND is_active = true;
