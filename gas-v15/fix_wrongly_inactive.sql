-- ════════════════════════════════════════════════════════════════════════════════
-- 🛠️ FIX: Restore payment_status for 10 SELF-PAUSED users (NOT over quota)
-- ════════════════════════════════════════════════════════════════════════════════

UPDATE users 
SET payment_status = 'active',
    updated_at = NOW()
WHERE email IN (
    'dineshmonga22@gmail.com',
    'jerryvibes.444@gmail.com',
    'gurnoor1311singh@gmail.com',
    'salonirajput78690@gmail.com',
    'bangersonia474@gmail.com',
    'loveleensharma530@gmail.com',
    'simranrakhra970@gmail.com',
    'rupanasameer551@gmail.com',
    'manatsingh5600@gmail.com',
    'prince@gmail.com'
);

-- ════════════════════════════════════════════════════════════════════════════════
-- ✅ VERIFICATION
-- ════════════════════════════════════════════════════════════════════════════════
SELECT name, email, plan_name, is_active, payment_status
FROM users 
WHERE email IN (
    'dineshmonga22@gmail.com',
    'jerryvibes.444@gmail.com',
    'gurnoor1311singh@gmail.com',
    'salonirajput78690@gmail.com',
    'bangersonia474@gmail.com',
    'loveleensharma530@gmail.com',
    'simranrakhra970@gmail.com',
    'rupanasameer551@gmail.com',
    'manatsingh5600@gmail.com',
    'prince@gmail.com'
)
ORDER BY plan_name, name;
