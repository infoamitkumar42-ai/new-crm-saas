-- ============================================================================
-- DEEP SEARCH: WHERE ARE THE 441 LEADS?
-- ============================================================================

-- 1. Total count for the ENTIRE day (Jan 9)
SELECT 
    status, 
    COUNT(*) as total_count,
    MIN(created_at) at time zone 'Asia/Kolkata' as earliest,
    MAX(created_at) at time zone 'Asia/Kolkata' as latest
FROM leads 
WHERE created_at >= '2026-01-09 00:00:00'::timestamptz
GROUP BY 1;

-- 2. Check for Duplicates or Errors (If tables exist)
-- Some leads might have been flagged as duplicates during sync
SELECT 'Duplicate Leads' as table, COUNT(*) FROM duplicate_leads WHERE created_at >= '2026-01-09 00:00:00'::timestamptz
UNION ALL
SELECT 'Orphan Leads', COUNT(*) FROM orphan_leads WHERE created_at >= '2026-01-09 00:00:00'::timestamptz;

-- 3. Check for leads with NO status or NULL status (rare but possible)
SELECT COUNT(*) FROM leads WHERE status IS NULL OR status = '';

-- 4. Check the 10 "New" leads from today - why are they not moving?
-- (Check if they have phone numbers or names that look like test data)
SELECT id, name, phone, created_at 
FROM leads 
WHERE status = 'New' AND created_at >= '2026-01-09 06:30:00'::timestamptz
LIMIT 10;
