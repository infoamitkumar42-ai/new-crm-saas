-- ════════════════════════════════════════════════════════════════════════════════
-- 🛑 SET PAYMENT_STATUS = 'inactive' FOR ALL STOPPED USERS
-- This will show "Plan Inactive" on their dashboard
-- ════════════════════════════════════════════════════════════════════════════════

-- Update ALL stopped users (is_active = false) → payment_status = 'inactive'
UPDATE users 
SET payment_status = 'inactive',
    updated_at = NOW()
WHERE is_active = false 
AND payment_status = 'active';

-- ════════════════════════════════════════════════════════════════════════════════
-- ✅ VERIFICATION - All Stopped Users with Updated Status
-- ════════════════════════════════════════════════════════════════════════════════
SELECT 
    name, 
    plan_name, 
    is_active, 
    payment_status,
    CASE 
        WHEN payment_status = 'inactive' THEN '🔴 INACTIVE'
        ELSE '🟢 ACTIVE'
    END as dashboard_status
FROM users 
WHERE is_active = false
ORDER BY plan_name, name;
