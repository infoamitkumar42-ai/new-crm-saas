-- 1. Check ALL Lead Sources from Today (to find the exact name)
SELECT 
    source, 
    COUNT(*) as count,
    MIN(created_at) as first_lead,
    MAX(created_at) as last_lead
FROM leads 
WHERE created_at >= CURRENT_DATE
GROUP BY source;

-- 2. Find ANY lead that mentions 'Rajwinder' in source, notes, or tags
SELECT 
    id, 
    name, 
    source, 
    assigned_to, 
    (SELECT name FROM users WHERE id = leads.assigned_to) as assigned_user_name,
    created_at
FROM leads 
WHERE 
    created_at >= CURRENT_DATE
    AND (
        source ILIKE '%Rajwinder%' 
        OR notes ILIKE '%Rajwinder%' 
        OR tags::text ILIKE '%Rajwinder%'
    )
ORDER BY created_at DESC;

-- 3. Check for UNASSIGNED leads (in case they are stuck)
SELECT COUNT(*) as unassigned_count 
FROM leads 
WHERE assigned_to IS NULL AND created_at >= CURRENT_DATE;
