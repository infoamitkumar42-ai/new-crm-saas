
-- ============================================================================
-- 🛠️ MANUAL ACTIVATION SCRIPT (FEB 5)
-- ============================================================================

-- 1. Sejal Rani (Starter - Himanshu Team)
UPDATE users 
SET 
    plan_name = 'starter',
    daily_limit = 55,
    valid_until = NOW() + INTERVAL '30 days',
    is_active = true,
    payment_status = 'active',
    is_online = true, -- Auto-online for today
    team_code = 'TEAMFIRE',
    updated_at = NOW()
WHERE email = 'sejalrani72@gmail.com';

-- 2. Pooja Jolly (Starter - Himanshu Team)
UPDATE users 
SET 
    plan_name = 'starter',
    daily_limit = 55,
    valid_until = NOW() + INTERVAL '30 days',
    is_active = true,
    payment_status = 'active',
    is_online = true,
    team_code = 'TEAMFIRE',
    updated_at = NOW()
WHERE email = 'jollypooja5@gmail.com';

-- 3. BS (bs0525765349) (Supervisor - Himanshu Team - Manual Renew)
-- Paying 2k for Supervisor (Limit 115)
UPDATE users 
SET 
    plan_name = 'supervisor',
    daily_limit = 115,
    valid_until = NOW() + INTERVAL '30 days',
    is_active = true,
    payment_status = 'active',
    is_online = true,
    team_code = 'TEAMFIRE',
    updated_at = NOW()
WHERE email = 'bs0525765349@gmail.com';

-- 4. Sameer Chauhan (Fix Renew Popup)
-- Issue: Validity Date expired even if active status was true.
-- Fix: Extend validity by 30 days from today.
UPDATE users 
SET 
    valid_until = NOW() + INTERVAL '30 days',
    is_active = true,
    payment_status = 'active',
    updated_at = NOW()
WHERE email = 'sameerchauhan010424@gmail.com';

-- Verification Query
SELECT name, email, plan_name, daily_limit, valid_until, is_active 
FROM users 
WHERE email IN (
    'sejalrani72@gmail.com', 
    'jollypooja5@gmail.com', 
    'bs0525765349@gmail.com', 
    'sameerchauhan010424@gmail.com'
);
