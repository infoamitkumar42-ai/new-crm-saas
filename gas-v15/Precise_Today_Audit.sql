-- ============================================================================
-- AUDIT: STATUS OF TODAY'S 441 LEADS (Since 12:00 PM IST)
-- ============================================================================

-- This script ONLY READS data. It does not modify anything.
-- 12:00 PM IST = 06:30 AM UTC

SELECT 
    status, 
    COUNT(*) as lead_count,
    CASE 
        WHEN status IN ('New', 'Fresh') THEN '❌ NOT DISTRIBUTED YET'
        WHEN status = 'Assigned' THEN '✅ DISTRIBUTED'
        ELSE 'ℹ️ OTHER (Interested/Rejected/etc)'
    END as distribution_category
FROM leads 
WHERE created_at >= '2026-01-09 06:30:00'::timestamptz
GROUP BY 1, 3
ORDER BY 2 DESC;

-- Detailed check: Oldest and Newest of these 441 leads
SELECT 
    MIN(created_at) at time zone 'Asia/Kolkata' as oldest_lead_ist,
    MAX(created_at) at time zone 'Asia/Kolkata' as newest_lead_ist
FROM leads 
WHERE created_at >= '2026-01-09 06:30:00'::timestamptz;
