-- ============================================================================
-- 🚀 ACTIVATE POOJA (MANUAL UPI - FEB 12) - CORRECTED TEAM
-- ============================================================================

BEGIN;

-- 1. Record Payment for Pooja (₹999 - Starter Plan)
-- Using the ID found in DB: 0275b490-0ffa-4887-b92a-70f1b0db1f02
INSERT INTO payments (
    user_id, 
    amount, 
    plan_name, 
    razorpay_payment_id, 
    status, 
    created_at, 
    payer_email
) VALUES (
    '0275b490-0ffa-4887-b92a-70f1b0db1f02', 
    999, 
    'starter', 
    'MANUAL_UPI_FEB12', 
    'captured', 
    '2026-02-12 14:00:00+00', 
    'jollypooja5@gmail.com'
);

-- 2. Update Quota, Team & Activation
-- Current leads_received: 182
-- Quota Increase: +50
-- New promised: 182 + 50 = 232
UPDATE users 
SET 
    is_active = true,
    team_code = 'TEAMFIRE', -- User corrected this
    plan_name = 'starter',
    total_leads_promised = 232,
    daily_limit = 5,
    updated_at = NOW()
WHERE id = '0275b490-0ffa-4887-b92a-70f1b0db1f02';

COMMIT;

-- VERIFICATION
SELECT name, email, team_code, is_active, total_leads_promised, total_leads_received, daily_limit
FROM users
WHERE email = 'jollypooja5@gmail.com';
