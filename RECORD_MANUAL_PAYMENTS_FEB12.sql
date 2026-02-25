-- ============================================================================
-- 🚀 RECORD MANUAL PAYMENTS (ARSH & KULWANT) - FEB 12 (PLAN SPECIFIC)
-- ============================================================================

BEGIN;

-- 1. Record Payment for Arshdeep kaur (₹999 - Starter Plan)
INSERT INTO payments (
    user_id, 
    amount, 
    plan_name, 
    razorpay_payment_id, 
    status, 
    created_at, 
    payer_email
) VALUES (
    'a921d3c0-ca74-4e37-ade3-cf6439ac4fc5', 
    999, 
    'starter', 
    'MANUAL_UPI_FEB12', 
    'captured', 
    '2026-02-12 10:00:00+00', 
    'arshkaur6395@gmail.com'
);

-- 2. Record Payment for Kulwant Singh (₹1999 - Supervisor Plan)
INSERT INTO payments (
    user_id, 
    amount, 
    plan_name, 
    razorpay_payment_id, 
    status, 
    created_at, 
    payer_email
) VALUES (
    '2b728022-0072-44fb-a0d5-6a1a6924027e', 
    1999, 
    'supervisor', 
    'MANUAL_UPI_FEB12', 
    'captured', 
    '2026-02-12 11:00:00+00', 
    'kulwantsinghdhaliwalsaab668@gmail.com'
);

-- 3. Update Quotas & Activation
-- Note: Base quota was 55. 
-- Arsh: 55 + 115 = 170
-- Kulwant: 55 + 230 = 285

UPDATE users 
SET 
    is_active = true,
    plan_name = 'starter',
    total_leads_promised = 170,
    daily_limit = 5,
    updated_at = NOW()
WHERE email = 'arshkaur6395@gmail.com';

UPDATE users 
SET 
    is_active = true,
    plan_name = 'supervisor',
    total_leads_promised = 285,
    daily_limit = 7,
    updated_at = NOW()
WHERE email = 'kulwantsinghdhaliwalsaab668@gmail.com';

COMMIT;

-- VERIFICATION
SELECT u.name, u.email, u.plan_name, u.is_active, u.total_leads_promised, u.total_leads_received, 
       (SELECT COUNT(*) FROM payments p WHERE p.user_id = u.id AND p.status = 'captured' AND p.created_at >= '2026-02-12') as recent_payments
FROM users u
WHERE email IN ('arshkaur6395@gmail.com', 'kulwantsinghdhaliwalsaab668@gmail.com');
