-- ============================================================================
-- 🔍 FULL VERIFICATION - 73 Users Quota Exceeded
-- ============================================================================
-- CRITICAL: Manual review required before any blocking action
-- ============================================================================

-- STEP 1: Get complete list with payment details
SELECT 
    u.name,
    u.email,
    u.plan_name,
    u.total_leads_received as received,
    u.total_leads_promised as quota,
    u.total_leads_received - u.total_leads_promised as exceeded_by,
    u.payment_status,
    u.is_active,
    u.created_at as signup_date,
    -- Payment analysis
    (SELECT COUNT(*) FROM payments p WHERE p.user_id = u.id AND p.status = 'completed') as completed_payments,
    (SELECT COUNT(*) FROM payments p WHERE p.user_id = u.id AND p.status = 'pending') as pending_payments,
    (SELECT MIN(created_at) FROM payments p WHERE p.user_id = u.id) as first_payment,
    (SELECT MAX(created_at) FROM payments p WHERE p.user_id = u.id) as last_payment,
    (SELECT SUM(amount) FROM payments p WHERE p.user_id = u.id AND p.status = 'completed') as total_paid,
    -- Decision helper
    CASE 
        WHEN (SELECT COUNT(*) FROM payments p WHERE p.user_id = u.id AND p.status = 'pending') > 0 
        THEN '🟡 HAS PENDING PAYMENT - VERIFY FIRST'
        WHEN (SELECT COUNT(*) FROM payments p WHERE p.user_id = u.id AND p.status = 'completed') > 1 
        THEN '🔴 MULTIPLE PAYMENTS - LIKELY RENEWED'
        WHEN (SELECT MAX(created_at) FROM payments p WHERE p.user_id = u.id) > NOW() - INTERVAL '7 days'
        THEN '🟠 RECENT PAYMENT - CHECK RENEWAL'
        WHEN (SELECT MAX(created_at) FROM payments p WHERE p.user_id = u.id) < NOW() - INTERVAL '30 days'
        THEN '🟢 OLD PAYMENT - OK TO BLOCK'
        ELSE '🟡 MANUAL REVIEW NEEDED'
    END as review_status
FROM users u
WHERE u.team_code IN ('TEAMFIRE', 'TEAMRAJ', 'GJ01TEAMFIRE')
  AND u.total_leads_promised IS NOT NULL 
  AND u.total_leads_promised > 0
  AND u.total_leads_received >= u.total_leads_promised
ORDER BY 
    CASE 
        WHEN (SELECT COUNT(*) FROM payments p WHERE p.user_id = u.id AND p.status = 'pending') > 0 THEN 1
        WHEN (SELECT COUNT(*) FROM payments p WHERE p.user_id = u.id AND p.status = 'completed') > 1 THEN 2
        WHEN (SELECT MAX(created_at) FROM payments p WHERE p.user_id = u.id) > NOW() - INTERVAL '7 days' THEN 3
        ELSE 4
    END,
    u.total_leads_received DESC;

-- ============================================================================
-- STEP 2: Get detailed payment history for flagged users
-- ============================================================================

SELECT 
    u.name,
    u.email,
    p.amount,
    p.plan_type,
    p.status,
    p.created_at as payment_date,
    EXTRACT(DAY FROM NOW() - p.created_at) as days_ago
FROM users u
JOIN payments p ON p.user_id = u.id
WHERE u.team_code IN ('TEAMFIRE', 'TEAMRAJ', 'GJ01TEAMFIRE')
  AND u.total_leads_received >= u.total_leads_promised
  AND u.total_leads_promised > 0
ORDER BY u.name, p.created_at DESC;

-- ============================================================================
-- STEP 3: Users who DEFINITELY renewed (2+ completed payments)
-- ============================================================================

SELECT 
    u.name,
    u.email,
    u.total_leads_received as current_received,
    u.total_leads_promised as current_quota,
    (SELECT COUNT(*) FROM payments p WHERE p.user_id = u.id AND p.status = 'completed') as times_renewed,
    (SELECT SUM(amount) FROM payments p WHERE p.user_id = u.id AND p.status = 'completed') as total_revenue,
    '⚠️ NEEDS QUOTA UPDATE' as action_required
FROM users u
WHERE u.team_code IN ('TEAMFIRE', 'TEAMRAJ', 'GJ01TEAMFIRE')
  AND u.total_leads_received >= u.total_leads_promised
  AND u.total_leads_promised > 0
  AND (SELECT COUNT(*) FROM payments p WHERE p.user_id = u.id AND p.status = 'completed') > 1
ORDER BY times_renewed DESC, total_revenue DESC;

-- ============================================================================
-- 📋 MANUAL REVIEW CHECKLIST:
-- ============================================================================
--
-- For each user in STEP 1 results:
--
-- 🔴 MULTIPLE PAYMENTS (2+)
--    → Check payment dates to confirm renewals
--    → Calculate new quota: payments × plan quota
--    → Update total_leads_promised manually
--    → DO NOT BLOCK
--
-- 🟡 PENDING PAYMENT
--    → Contact user to verify payment
--    → Check payment gateway for status
--    → Wait for confirmation before blocking
--    → DO NOT BLOCK YET
--
-- 🟠 RECENT PAYMENT (<7 days)
--    → Double-check if it's a renewal or first payment
--    → Verify quota was updated correctly
--    → Review needed before blocking
--
-- 🟢 OLD PAYMENT (30+ days, single payment)
--    → Quota genuinely exhausted
--    → Safe to keep blocked
--    → User needs to renew
--
-- ============================================================================
