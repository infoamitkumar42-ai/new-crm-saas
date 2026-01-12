-- ============================================================================
-- FINAL BREAKDOWN: STATUS OF THE 506 LEADS (Jan 9)
-- ============================================================================

-- 1. Status breakdown of all 506 leads
SELECT 
    status, 
    COUNT(*) as lead_count,
    CASE 
        WHEN status = 'Delivered' OR status = 'Assigned' THEN '✅ REACHED AGENTS'
        WHEN status = 'New' OR status = 'Fresh' THEN '❌ WAITING IN POOL'
        ELSE 'ℹ️ OTHER (Invalid/Contacted/etc)'
    END as status_category
FROM leads 
WHERE created_at >= '2026-01-08 18:30:00'::timestamptz -- Jan 9 IST Start
GROUP BY 1, 3
ORDER BY 2 DESC;

-- 2. Hourly Arrival (To see where the 441 batch is)
SELECT 
    DATE_TRUNC('hour', created_at) at time zone 'Asia/Kolkata' as hour_ist,
    COUNT(*) as lead_count
FROM leads 
WHERE created_at >= '2026-01-08 18:30:00'::timestamptz
GROUP BY 1
ORDER BY 1 DESC;

-- 3. Check for specific status mix in today's batch
SELECT 
    status, 
    user_id IS NOT NULL as has_owner,
    COUNT(*)
FROM leads 
WHERE created_at >= '2026-01-08 18:30:00'::timestamptz
GROUP BY 1, 2;
