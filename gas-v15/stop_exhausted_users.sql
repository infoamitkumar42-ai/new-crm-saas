-- ════════════════════════════════════════════════════════════════════
-- 🛑 CUSTOM USER STOP / LIMIT UPDATE
-- ════════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════
-- 1️⃣ JASHANDEEP KAUR - STOP NOW (62/50 received)
-- ══════════════════════════════════════════════════════════════
UPDATE users 
SET is_active = false, 
    daily_limit = 0,
    updated_at = NOW()
WHERE name = 'Jashandeep Kaur' AND plan_name = 'starter';

-- ══════════════════════════════════════════════════════════════
-- 2️⃣ ROHIT KUMAR - STOP NOW (57/50 received)
-- ══════════════════════════════════════════════════════════════
UPDATE users 
SET is_active = false, 
    daily_limit = 0,
    updated_at = NOW()
WHERE name = 'Rohit Kumar' AND plan_name = 'starter';

-- ══════════════════════════════════════════════════════════════
-- 3️⃣ SUMAN - Allow 3 more leads today, then manual stop
--    Current: 51 leads | Today's Limit: 3 | Total Target: 54
-- ══════════════════════════════════════════════════════════════
UPDATE users 
SET daily_limit = 3,
    total_leads_promised = 54,
    updated_at = NOW()
WHERE name = 'Suman' AND plan_name = 'starter';

-- ══════════════════════════════════════════════════════════════
-- 4️⃣ BABITA - Only 3 more leads today (2 already received), then STOP
--    Current: 53 leads | Today: 2 received, 3 remaining | Total Target: 56
--    Set daily_limit = 3 (remaining for today)
-- ══════════════════════════════════════════════════════════════
UPDATE users 
SET daily_limit = 3,
    total_leads_promised = 56,
    updated_at = NOW()
WHERE name = 'Babita' AND plan_name = 'starter';

-- ════════════════════════════════════════════════════════════════════
-- ✅ VERIFICATION
-- ════════════════════════════════════════════════════════════════════
SELECT 
    name, 
    plan_name, 
    is_active, 
    daily_limit,
    total_leads_promised,
    CASE 
        WHEN is_active = false THEN '🔴 STOPPED'
        ELSE '🟢 ACTIVE'
    END as status
FROM users 
WHERE name IN ('Jashandeep Kaur', 'Rohit Kumar', 'Suman', 'Babita') 
AND plan_name = 'starter';
