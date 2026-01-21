-- ═══════════════════════════════════════════════════════════════════
-- 🔧 FIX: Update total_leads_promised Based on Plan Type
-- ═══════════════════════════════════════════════════════════════════

-- STARTER PLAN: 10 days × 5 leads = 50
UPDATE users 
SET total_leads_promised = 50
WHERE LOWER(plan_name) = 'starter';

-- SUPERVISOR PLAN: 15 days × 7 leads = 105
UPDATE users 
SET total_leads_promised = 105
WHERE LOWER(plan_name) = 'supervisor';

-- MANAGER PLAN: 20 days × 8 leads = 160
UPDATE users 
SET total_leads_promised = 160
WHERE LOWER(plan_name) = 'manager';

-- WEEKLY BOOST: 7 days × 12 leads = 84
UPDATE users 
SET total_leads_promised = 84
WHERE LOWER(plan_name) = 'weekly_boost';

-- TURBO BOOST: 7 days × 14 leads = 98
UPDATE users 
SET total_leads_promised = 98
WHERE LOWER(plan_name) = 'turbo_boost';

-- ═══════════════════════════════════════════════════════════════════
-- VERIFICATION: Check Updated Values
-- ═══════════════════════════════════════════════════════════════════
SELECT 
    plan_name,
    COUNT(*) as user_count,
    MIN(total_leads_promised) as promised_leads
FROM users 
WHERE plan_name IS NOT NULL AND plan_name != 'none' AND plan_name != ''
GROUP BY plan_name
ORDER BY promised_leads DESC;
