-- =====================================================
-- MANUAL ADMIN UPGRADES - FOR RESET LATER
-- Date: 2026-01-14
-- Reset after 12 AM to original paid plans
-- =====================================================

-- 36 users manually upgraded by admin (no payment record)

-- TURBO_BOOST (4 users)
-- Gurnam | gurnambal01@gmail.com | 2026-01-13 23:57:29
-- Sandeep | sunnymehre451@gmail.com | 2026-01-13 23:57:16
-- Rajwinder Singh | workwithrajwinder@gmail.com | 2026-01-13 23:56:52
-- Himanshu Sharma | sharmahimanshu9797@gmail.com | 2026-01-10 02:44:00

-- WEEKLY_BOOST (2 users)
-- Rajni | rajnikaler01@gmail.com | 2026-01-13 23:57:06
-- Sonia | bangersonia474@gmail.com | 2026-01-11 07:59:49

-- MANAGER (3 users)
-- Priya Arora | priyaarora50505@gmail.com | 2026-01-11 14:51:13
-- Akash | dbrar8826@gmail.com | 2026-01-11 07:45:50
-- Suman | sumansumankaur09@gmail.com | 2026-01-10 07:08:36

-- SUPERVISOR (27 users)
-- Rohit Kumar, Saloni, Sameer, Seerat, Navjot kaur, Simran, Prince,
-- ranjodh singh, Tushte, PARAMJIT KAUR, Akshmala, Jasdeep Kaur,
-- Sandeep Rehaan, Jashandeep Kaur, Preeti, Gurdeep Singh, Rimpy Singh,
-- Rajni, Babita, Baljeet kaur, Arshdeep kaur, Kulwant Singh,
-- Lalit kumar, Naina Nawani, MUSKAN, Princy, Balraj singh

-- =====================================================
-- QUERY TO GET ORIGINAL PAID PLAN FOR EACH USER
-- =====================================================

SELECT 
    u.id,
    u.name,
    u.email,
    u.plan_name as current_manual_plan,
    p.plan_name as original_paid_plan,
    p.created_at as payment_date
FROM users u
LEFT JOIN payments p ON u.id = p.user_id AND p.status = 'captured'
WHERE u.id IN (
    SELECT u2.id FROM users u2
    LEFT JOIN payments p2 ON u2.id = p2.user_id 
        AND p2.status = 'captured'
        AND p2.plan_name = u2.plan_name
    WHERE u2.plan_name IS NOT NULL 
      AND u2.plan_name != 'none'
      AND p2.id IS NULL
)
ORDER BY p.created_at DESC NULLS LAST;

-- =====================================================
-- RESET QUERY (RUN AFTER 12 AM)
-- This will reset users to their original paid plan
-- =====================================================

-- Step 1: Find users with original paid plan and reset
-- UPDATE users u
-- SET 
--     plan_name = (SELECT p.plan_name FROM payments p WHERE p.user_id = u.id AND p.status = 'captured' ORDER BY p.created_at DESC LIMIT 1),
--     updated_at = NOW()
-- WHERE u.id IN (... list of manual upgrade user IDs ...);

-- Step 2: For users with NO payment history, set plan_name = 'none'
-- UPDATE users
-- SET plan_name = 'none', daily_limit = 0, updated_at = NOW()
-- WHERE id IN (... user IDs with no payment ...);
