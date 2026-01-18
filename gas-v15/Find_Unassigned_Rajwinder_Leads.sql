-- Find UNASSIGNED leads from Rajwinder's page (from screenshot)
-- Excluding Invalid and Already Assigned leads
-- Date: Yesterday (2026-01-16)

SELECT 
    id,
    name,
    phone,
    city,
    status,
    source,
    created_at,
    assigned_to
FROM leads 
WHERE 
    -- Date filter: Yesterday
    created_at >= '2026-01-16 00:00:00' 
    AND created_at < '2026-01-17 00:00:00'
    
    -- ONLY Unassigned leads
    AND assigned_to IS NULL
    
    -- Exclude Invalid status
    AND status NOT IN ('Invalid', 'Assigned')
    
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

-- Count Summary
SELECT 
    status,
    COUNT(*) as count
FROM leads 
WHERE 
    created_at >= '2026-01-16 00:00:00' 
    AND created_at < '2026-01-17 00:00:00'
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
GROUP BY status;
