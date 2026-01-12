-- ============================================================================
-- 🕵️‍♂️ DIAGNOSTIC CHECK: DASHBOARD vs REALITY (IST TIMEZONE)
-- ============================================================================

-- 1. Check Revenue (Actually Captured Today in IST)
SELECT 
    'Revenue Check' as test_name,
    COUNT(*) as payments_count,
    SUM(amount) as total_revenue
FROM payments 
WHERE status = 'captured' 
AND (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date;

-- 2. Check Lead Counts (Counters vs Actuals) for Top 10 Users
SELECT 
    u.name,
    u.email,
    u.leads_today as dashboard_counter,
    (
        SELECT COUNT(*) 
        FROM leads l 
        WHERE l.user_id = u.id 
        AND (l.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date
    ) as actual_leads_in_db,
    u.leads_today - (
        SELECT COUNT(*) 
        FROM leads l 
        WHERE l.user_id = u.id 
        AND (l.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date
    ) as discrepancy
FROM users u
ORDER BY u.leads_today DESC
LIMIT 10;

-- 3. Check System Timezones
SELECT 
    NOW() as server_now,
    NOW() AT TIME ZONE 'Asia/Kolkata' as ist_now,
    CURRENT_DATE as server_date,
    (NOW() AT TIME ZONE 'Asia/Kolkata')::date as ist_date;
