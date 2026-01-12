-- ============================================================================
-- DEBUG: WHY ARE LEADS BEING FILTERED AS JUNK?
-- ============================================================================

-- 1. Check top 25 leads that the distributor is likely fetching
-- (Status='New' and created today)
SELECT 
    id, 
    name, 
    phone, 
    status, 
    created_at,
    LENGTH(phone) as phone_len,
    (phone ~ '^[6-9]\d{9}$') as passes_phone_regex
FROM leads 
WHERE status = 'New' 
  AND created_at >= CURRENT_DATE
ORDER BY created_at ASC
LIMIT 25;

-- 2. Check if any 'Fresh' leads should be 'New'
SELECT COUNT(*) FROM leads WHERE status = 'Fresh';

-- 3. Check for specific common "Junk" reasons
SELECT 
    COUNT(*) as count,
    CASE 
        WHEN phone IS NULL OR phone = '' THEN 'Missing Phone'
        WHEN LENGTH(phone) != 10 THEN 'Wrong Length'
        WHEN NOT (phone ~ '^[6-9]') THEN 'Invalid Prefix'
        WHEN name IS NULL OR name = '' THEN 'Missing Name'
        WHEN name ILIKE ANY(ARRAY['%test%', '%demo%', '%undefined%']) THEN 'Junk Name'
        ELSE 'Other'
    END as reason
FROM leads 
WHERE status = 'New' AND created_at >= CURRENT_DATE
GROUP BY 2;
