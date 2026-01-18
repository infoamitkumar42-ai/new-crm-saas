-- Get detailed list of the 17 UNASSIGNED leads (15 New + 2 Night_Backlog)
-- These are ready to be assigned to Rajwinder's team

SELECT 
    id,
    name,
    phone,
    city,
    status,
    source,
    created_at
FROM leads 
WHERE 
    -- Date: Yesterday
    created_at >= '2026-01-16 00:00:00' 
    AND created_at < '2026-01-17 00:00:00'
    
    -- ONLY New and Night_Backlog (the unassigned ones)
    AND status IN ('New', 'Night_Backlog')
    
    -- Match names from screenshot
    AND (
        name ILIKE '%Ravinder%' OR
        name ILIKE '%Taran%' OR
        name ILIKE '%Tannu%' OR
        name ILIKE '%Veerpal%' OR
        name ILIKE '%jass%' OR
        name ILIKE '%Laddi%' OR
        name ILIKE '%Gurwind%' OR
        name ILIKE '%Inderjit%' OR
        name ILIKE '%Vikramjit%' OR
        name ILIKE '%Karan%' OR
        name ILIKE '%Sani%' OR
        name ILIKE '%virdi%' OR
        name ILIKE '%Amandeep%' OR
        name ILIKE '%Khushi%' OR
        name ILIKE '%Harry%' OR
        name ILIKE '%Mohit%' OR
        name ILIKE '%Sukh%' OR
        name ILIKE '%Lakh%' OR
        name ILIKE '%Narinder%' OR
        name ILIKE '%jashan%' OR
        name ILIKE '%man_preet%' OR
        name ILIKE '%Bhardv%' OR
        name ILIKE '%Rupinder%' OR
        name ILIKE '%pinder%' OR
        name ILIKE '%KHUSH%' OR
        name ILIKE '%Lovepreet%'
    )
ORDER BY created_at DESC;
