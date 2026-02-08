-- ============================================================================
-- 🚨 DIAGNOSTIC: Find Missing Leads
-- ============================================================================

-- Query 1: All leads today by status
SELECT 
    status,
    COUNT(*) as count,
    MIN(created_at) as first,
    MAX(created_at) as last
FROM leads
WHERE created_at >= CURRENT_DATE
GROUP BY status
ORDER BY count DESC;

-- Query 2: Check for error/rejected leads
SELECT 
    status,
    source,
    name,
    phone,
    notes,
    created_at
FROM leads
WHERE created_at >= CURRENT_DATE
  AND (
    status LIKE '%Error%' 
    OR status LIKE '%Reject%' 
    OR status LIKE '%Invalid%'
    OR status = 'Night_Backlog'
    OR status = 'Queued'
  )
ORDER BY created_at DESC;

-- Query 3: Check if there's a webhook_logs or error_logs table
SELECT 
    table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (table_name LIKE '%log%' OR table_name LIKE '%error%')
ORDER BY table_name;

-- Query 4: All leads today with full details
SELECT 
    source,
    status,
    assigned_to,
    name,
    phone,
    TO_CHAR(created_at, 'HH24:MI:SS') as time,
    notes
FROM leads
WHERE created_at >= CURRENT_DATE
ORDER BY created_at DESC;

-- Query 5: Count total leads received per hour today
SELECT 
    EXTRACT(HOUR FROM created_at) as hour,
    COUNT(*) as leads,
    COUNT(CASE WHEN assigned_to IS NOT NULL THEN 1 END) as assigned,
    COUNT(CASE WHEN assigned_to IS NULL THEN 1 END) as unassigned
FROM leads
WHERE created_at >= CURRENT_DATE
GROUP BY EXTRACT(HOUR FROM created_at)
ORDER BY hour DESC;
