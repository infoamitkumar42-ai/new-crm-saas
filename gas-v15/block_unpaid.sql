
-- 🛡️ BLOCK UNPAID USERS (Security Update)
-- Prevents leads from leaking to 'none' or 'basic' plans.

UPDATE users
SET daily_limit = 0,
    updated_at = NOW()
WHERE 
    is_active = true 
    AND (
        plan_name IS NULL 
        OR plan_name = '' 
        OR LOWER(plan_name) = 'none' 
        OR LOWER(plan_name) = 'basic'
    );

-- Verify
SELECT count(*) as blocked_users FROM users WHERE daily_limit = 0 AND is_active = true;
