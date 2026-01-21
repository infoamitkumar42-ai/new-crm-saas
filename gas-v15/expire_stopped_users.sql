-- ════════════════════════════════════════════════════════════════════════════════
-- 🛑 FULLY STOP ALL OVER-QUOTA USERS (Set payment_status = 'inactive')
-- This will show "Plan Expired" on their dashboard and allow re-subscription
-- ════════════════════════════════════════════════════════════════════════════════

-- Weekly Boost Users (Over Quota)
UPDATE users 
SET payment_status = 'inactive',
    is_active = false, 
    daily_limit = 0,
    updated_at = NOW()
WHERE name IN ('Palak', 'Navpreet kaur', 'Prabhjeet kaur', 'Ravenjeet Kaur', 'Rahul Rai', 'Sneha') 
AND plan_name = 'weekly_boost';

-- Starter Users (Over Quota - Already Stopped)
UPDATE users 
SET payment_status = 'inactive',
    updated_at = NOW()
WHERE name IN ('Rohit Kumar', 'Jashandeep Kaur') 
AND plan_name = 'starter'
AND is_active = false;

-- ════════════════════════════════════════════════════════════════════════════════
-- ✅ VERIFICATION
-- ════════════════════════════════════════════════════════════════════════════════
SELECT 
    name, 
    plan_name, 
    is_active, 
    payment_status,
    CASE 
        WHEN payment_status = 'inactive' THEN '🔴 EXPIRED'
        ELSE '🟢 ACTIVE'
    END as dashboard_status
FROM users 
WHERE name IN ('Palak', 'Navpreet kaur', 'Prabhjeet kaur', 'Ravenjeet Kaur', 'Rahul Rai', 'Sneha', 'Rohit Kumar', 'Jashandeep Kaur')
ORDER BY plan_name, name;
