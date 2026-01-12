-- ============================================================================
-- EMERGENCY PRIORITY & QUOTA SYNC
-- ============================================================================

-- 1. SYNC users_subscription with actual counts
-- This ensures the distributor STOPs sending leads to those who are full
UPDATE users_subscription us
SET leads_sent = (
    SELECT COUNT(*) FROM leads l 
    WHERE l.user_id = us.user_id AND l.assigned_at >= CURRENT_DATE
),
updated_at = NOW();

-- 2. APPLY "SUPER PRIORITY" TO UNDERSERVED USERS
-- We temporarily change their plan to 'Booster' (Priority 1)
-- so they get leads before Supervisor/Starter/Manager.

-- A. Reset any previous temporary boosters (Safe cleanup)
UPDATE users_subscription 
SET plan_name = 'Starter' 
WHERE plan_name = 'SuperPriority'; -- If we used this before

-- B. Boost users with 0 or 1 lead today
UPDATE users_subscription us
SET plan_name = 'Booster'
WHERE user_id IN (
    SELECT id FROM users 
    WHERE email IN (
        'bangersonia474@gmail.com',     -- Sonia
        'sumansumankaur09@gmail.com',   -- Suman
        'diljots027@gmail.com',         -- Baljeet kaur
        'muskanchopra376@gmail.com',    -- MUSKAN
        'jerryvibes.444@gmail.com',     -- Akshay Sharma
        'rajbinderkamboj123@gmail.com', -- Rajbinder
        'knavjotkaur113@gmail.com',    -- Navjot Kaur
        'singhmanbir938@gmail.com',     -- Manbir Singh
        'rasganiya98775@gmail.com'      -- Lalit kumar
    )
);

-- 3. FINAL VERIFICATION (Check Priority Order)
SELECT 
    u.name,
    u.email,
    us.plan_name as active_plan,
    us.leads_sent as today_count,
    us.daily_limit
FROM users_subscription us
JOIN users u ON u.id = us.user_id
WHERE u.is_active = true AND u.payment_status = 'active'
ORDER BY 
    CASE us.plan_name 
        WHEN 'Booster' THEN 1 
        WHEN 'Manager' THEN 2 
        WHEN 'Supervisor' THEN 3 
        WHEN 'Starter' THEN 4 
        ELSE 5 
    END ASC,
    us.leads_sent ASC;
