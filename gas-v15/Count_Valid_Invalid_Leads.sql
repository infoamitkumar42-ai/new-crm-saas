-- Count Valid vs Invalid Leads (Today)

-- 1. Breakdown for 'Meta - rajwinders' source
SELECT 
    'Meta - rajwinders' as Source_Name,
    COUNT(CASE WHEN status != 'Invalid' AND is_valid_phone = true THEN 1 END) as Valid_Leads,
    COUNT(CASE WHEN status = 'Invalid' OR is_valid_phone = false THEN 1 END) as Invalid_Leads,
    COUNT(*) as Total_Leads
FROM leads 
WHERE source ILIKE '%rajwinder%'
AND created_at >= CURRENT_DATE;

-- 2. Global Breakdown by Source (To compare with others)
SELECT 
    source,
    COUNT(CASE WHEN status != 'Invalid' AND is_valid_phone = true THEN 1 END) as Valid_Count,
    COUNT(CASE WHEN status = 'Invalid' OR is_valid_phone = false THEN 1 END) as Invalid_Count,
    COUNT(*) as Total_Count
FROM leads
WHERE created_at >= CURRENT_DATE
GROUP BY source
ORDER BY Invalid_Count DESC;
