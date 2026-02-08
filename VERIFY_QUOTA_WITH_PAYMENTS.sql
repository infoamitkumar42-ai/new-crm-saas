-- ============================================================================
-- 🔍 COMPREHENSIVE QUOTA CHECK - With Payment History
-- ============================================================================
-- CRITICAL: Don't just look at counters - check payment renewals too!
-- ============================================================================

-- Query 1: Users who APPEAR over quota (but might have renewed)
SELECT 
    u.name,
    u.email,
    u.plan_name,
    u.total_leads_received as received,
    u.total_leads_promised as quota,
    u.total_leads_received - u.total_leads_promised as over_by,
    u.payment_status,
    u.is_active,
    -- Check if they have multiple payments (renewals)
    (SELECT COUNT(*) FROM payments p WHERE p.user_id = u.id AND p.status = 'completed') as total_payments,
    (SELECT MAX(created_at) FROM payments p WHERE p.user_id = u.id AND p.status = 'completed') as last_payment_date,
    CASE 
        WHEN u.total_leads_received >= u.total_leads_promised THEN '🔴 APPEARS FULL'
        WHEN u.total_leads_received >= u.total_leads_promised * 0.9 THEN '🟡 90% USED'
        ELSE '🟢 ACTIVE'
    END as status
FROM users u
WHERE u.team_code IN ('TEAMFIRE', 'TEAMRAJ', 'GJ01TEAMFIRE')
  AND u.total_leads_promised IS NOT NULL 
  AND u.total_leads_promised > 0
  AND u.total_leads_received >= u.total_leads_promised
ORDER BY over_by DESC;

-- Query 2: Check for pending/unverified renewals
SELECT 
    u.name,
    u.email,
    u.total_leads_received,
    u.total_leads_promised,
    p.amount,
    p.status as payment_status,
    p.created_at as payment_date,
    CASE 
        WHEN p.status = 'pending' THEN '⚠️ RENEWAL PENDING - DO NOT BLOCK'
        WHEN p.status = 'completed' THEN '✅ VERIFIED'
        ELSE '❓ CHECK MANUALLY'
    END as action_needed
FROM users u
LEFT JOIN payments p ON p.user_id = u.id
WHERE u.team_code IN ('TEAMFIRE', 'TEAMRAJ', 'GJ01TEAMFIRE')
  AND u.total_leads_received >= u.total_leads_promised
  AND u.total_leads_promised > 0
  AND p.created_at >= NOW() - INTERVAL '30 days'
ORDER BY p.created_at DESC;

-- Query 3: Safe to block - No recent payments
SELECT 
    u.name,
    u.email,
    u.total_leads_received as received,
    u.total_leads_promised as quota,
    u.total_leads_received - u.total_leads_promised as exceeded_by,
    (SELECT MAX(created_at) FROM payments p WHERE p.user_id = u.id) as last_payment,
    CASE 
        WHEN (SELECT MAX(created_at) FROM payments p WHERE p.user_id = u.id) < NOW() - INTERVAL '30 days' 
        THEN '✅ SAFE TO BLOCK'
        ELSE '⚠️ REVIEW NEEDED'
    END as blocking_recommendation
FROM users u
WHERE u.team_code IN ('TEAMFIRE', 'TEAMRAJ', 'GJ01TEAMFIRE')
  AND u.total_leads_received >= u.total_leads_promised
  AND u.total_leads_promised > 0
  AND NOT EXISTS (
      SELECT 1 FROM payments p 
      WHERE p.user_id = u.id 
      AND p.status = 'pending' 
      AND p.created_at >= NOW() - INTERVAL '30 days'
  )
ORDER BY last_payment DESC;

-- Query 4: Summary - Manual Review Required
SELECT 
    '🚨 ACTION REQUIRED' as alert,
    COUNT(*) as users_exceeded_quota,
    COUNT(CASE WHEN EXISTS (
        SELECT 1 FROM payments p 
        WHERE p.user_id = u.id 
        AND p.status IN ('pending', 'completed')
        AND p.created_at >= NOW() - INTERVAL '7 days'
    ) THEN 1 END) as recent_payments_verify_first,
    COUNT(CASE WHEN NOT EXISTS (
        SELECT 1 FROM payments p 
        WHERE p.user_id = u.id 
        AND p.created_at >= NOW() - INTERVAL '30 days'
    ) THEN 1 END) as safe_to_auto_block
FROM users u
WHERE u.team_code IN ('TEAMFIRE', 'TEAMRAJ', 'GJ01TEAMFIRE')
  AND u.total_leads_received >= u.total_leads_promised
  AND u.total_leads_promised > 0;

-- ============================================================================
-- 📋 IMPORTANT NOTES:
--
-- 1. System WILL auto-block users when quota is full (RPC enforces this)
-- 2. BUT you must manually verify payment history before taking action
-- 3. If user has pending renewal, wait for payment verification
-- 4. If user paid recently, check payment status first
-- 5. Only truly expired plans should be blocked
-- ============================================================================
