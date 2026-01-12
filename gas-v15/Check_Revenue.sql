-- ============================================================================
-- 💰 CHECK TODAY'S REVENUE (2026-01-10)
-- ============================================================================

-- 1. Summary
SELECT 
    'Today (2026-01-10)' as period,
    COUNT(*) as transaction_count,
    COALESCE(SUM(amount), 0) as total_revenue_inr
FROM payments
WHERE 
    status = 'captured' 
    -- Filter for today in IST (Starts 2026-01-10 00:00:00 IST)
    AND created_at >= '2026-01-09 18:30:00+00'; -- Equivalent to 00:00 IST

-- 2. Detailed List
SELECT 
    id,
    created_at,
    amount,
    status,
    -- method,  <-- Removing this as it doesn't exist
    payer_email
FROM payments
WHERE 
    status = 'captured' 
    AND created_at >= '2026-01-09 18:30:00+00'
ORDER BY created_at DESC;
