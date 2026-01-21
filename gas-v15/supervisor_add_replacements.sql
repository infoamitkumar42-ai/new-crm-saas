-- ════════════════════════════════════════════════════════════════════════════════
-- 📦 SUPERVISOR PLAN: Add 10 Replacement Leads to Total Commitment
-- ════════════════════════════════════════════════════════════════════════════════
-- 
-- Logic:
-- Original Plan: 105 leads
-- Replacement Commitment: 10 leads (for invalid/reported leads)
-- New Total: 105 + 10 = 115 leads
--
-- When user receives 115 leads → Plan complete → Auto-stop
-- ════════════════════════════════════════════════════════════════════════════════

-- Update ALL Supervisor users: Add 10 replacement leads to their quota
UPDATE users 
SET total_leads_promised = 115,  -- 105 original + 10 replacement
    updated_at = NOW()
WHERE plan_name = 'supervisor';

-- ════════════════════════════════════════════════════════════════════════════════
-- VERIFICATION: Check updated values
-- ════════════════════════════════════════════════════════════════════════════════
SELECT 
    name,
    plan_name,
    total_leads_promised,
    is_active,
    CASE 
        WHEN total_leads_promised = 115 THEN '✅ Updated (105+10)'
        ELSE '❌ Not Updated'
    END as status
FROM users 
WHERE plan_name = 'supervisor'
ORDER BY name;
