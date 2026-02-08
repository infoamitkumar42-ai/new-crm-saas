-- Check leads for today and their source pages
SELECT 
    COUNT(*) as total_leads_today,
    COALESCE(page_name, 'Unknown Page') as page_name,
    COALESCE(source, 'Unknown Source') as source,
    MIN(created_at) as earliest_today,
    MAX(created_at) as latest_today
FROM leads
WHERE created_at >= CURRENT_DATE
GROUP BY page_name, source
ORDER BY MAX(created_at) DESC;

-- List last 5 leads for verification
SELECT 
    name, 
    phone, 
    page_name, 
    source, 
    TO_CHAR(created_at, 'HH12:MI AM') as time
FROM leads
WHERE created_at >= CURRENT_DATE
ORDER BY created_at DESC
LIMIT 5;
