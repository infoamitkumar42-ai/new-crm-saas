-- ════════════════════════════════════════════════════════════════════════════════
-- 🛑 STOP 5 WEEKLY_BOOST USERS (All Over Quota)
-- ════════════════════════════════════════════════════════════════════════════════

-- 1️⃣ PALAK (96/84)
UPDATE users SET is_active = false, daily_limit = 0, updated_at = NOW()
WHERE name = 'Palak' AND plan_name = 'weekly_boost';

-- 2️⃣ NAVPREET KAUR (118/84)
UPDATE users SET is_active = false, daily_limit = 0, updated_at = NOW()
WHERE name = 'Navpreet kaur' AND plan_name = 'weekly_boost';

-- 3️⃣ PRABHJEET KAUR (106/84)
UPDATE users SET is_active = false, daily_limit = 0, updated_at = NOW()
WHERE name = 'Prabhjeet kaur' AND plan_name = 'weekly_boost';

-- 4️⃣ RAVENJEET KAUR (109/84)
UPDATE users SET is_active = false, daily_limit = 0, updated_at = NOW()
WHERE name = 'Ravenjeet Kaur' AND plan_name = 'weekly_boost';

-- 5️⃣ RAHUL RAI (105/84)
UPDATE users SET is_active = false, daily_limit = 0, updated_at = NOW()
WHERE name = 'Rahul Rai' AND plan_name = 'weekly_boost';

-- ════════════════════════════════════════════════════════════════════════════════
-- ✅ VERIFICATION
-- ════════════════════════════════════════════════════════════════════════════════
SELECT name, plan_name, is_active, daily_limit,
    CASE WHEN is_active = false THEN '🔴 STOPPED' ELSE '🟢 ACTIVE' END as status
FROM users 
WHERE name IN ('Palak', 'Navpreet kaur', 'Prabhjeet kaur', 'Ravenjeet Kaur', 'Rahul Rai') 
AND plan_name = 'weekly_boost';
