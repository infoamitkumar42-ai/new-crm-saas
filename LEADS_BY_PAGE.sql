-- ============================================================================
-- 📊 TODAY'S LEADS BREAKDOWN BY PAGE/SOURCE
-- ============================================================================

-- Query 1: Count by source (which Facebook page)
SELECT 
    source,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN assigned_to IS NOT NULL THEN 1 END) as assigned,
    COUNT(CASE WHEN assigned_to IS NULL THEN 1 END) as waiting,
    MIN(created_at) as first_lead,
    MAX(created_at) as last_lead
FROM leads
WHERE created_at >= CURRENT_DATE
GROUP BY source
ORDER BY total_leads DESC;

-- Query 2: Hourly breakdown by source
SELECT 
    EXTRACT(HOUR FROM created_at) as hour,
    source,
    COUNT(*) as leads,
    COUNT(CASE WHEN assigned_to IS NULL THEN 1 END) as waiting
FROM leads
WHERE created_at >= CURRENT_DATE
GROUP BY EXTRACT(HOUR FROM created_at), source
ORDER BY hour DESC, leads DESC;

-- Query 3: Detailed list of unassigned leads with source
SELECT 
    TO_CHAR(created_at, 'HH24:MI:SS') as time,
    source as facebook_page,
    name,
    phone,
    city,
    status
FROM leads
WHERE created_at >= CURRENT_DATE
  AND assigned_to IS NULL
ORDER BY created_at DESC;

-- Query 4: Just simple count by page (quick view)
SELECT 
    source as page_name,
    COUNT(*) as leads
FROM leads
WHERE created_at >= CURRENT_DATE
GROUP BY source
ORDER BY leads DESC;
