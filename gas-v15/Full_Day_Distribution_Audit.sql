-- ============================================================================
-- AUDIT: FULL DAY DISTRIBUTION BREAKDOWN (Jan 9, 2026)
-- ============================================================================
-- This script explains exactly WHERE the leads came from that users received today.

-- 1. TOTAL LEADS ASSIGNED TODAY (Categorized by Origin)
SELECT 
    CASE 
        WHEN created_at < '2026-01-09 02:30:00'::timestamptz THEN '🌙 NIGHT/BACKLOG (Before 8 AM IST)'
        WHEN created_at >= '2026-01-09 02:30:00'::timestamptz AND created_at < '2026-01-09 06:30:00'::timestamptz THEN '☀️ MORNING (8 AM - 12 PM IST)'
        WHEN created_at >= '2026-01-09 06:30:00'::timestamptz THEN '🚀 AFTERNOON (After 12 PM IST)'
        ELSE 'Other'
    END as lead_origin,
    status,
    COUNT(*) as count
FROM leads 
WHERE assigned_at >= '2026-01-08 18:30:00'::timestamptz -- Start of Jan 9 IST
GROUP BY 1, 2
ORDER BY 1;

-- 2. VERIFY 11 AM BACKLOG LOGIC
-- How many "Night Leads" were assigned today?
SELECT 
    COUNT(*) as total_backlog_distributed_today
FROM leads 
WHERE assigned_at >= '2026-01-08 18:30:00'::timestamptz
  AND created_at < '2026-01-09 02:30:00'::timestamptz; -- Created before 8 AM IST (02:30 UTC)

-- 3. TOTAL DB SNAPSHOT FOR JAN 9
SELECT 
    COUNT(*) as total_leads_in_db_for_today
FROM leads 
WHERE created_at >= '2026-01-08 18:30:00'::timestamptz;
