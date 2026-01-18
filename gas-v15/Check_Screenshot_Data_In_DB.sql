-- SEARCH FOR LEADS FROM SCREENSHOT
-- Checking both 'Valid' and 'Invalid' status

SELECT 
    id, 
    name, 
    phone, 
    city, 
    status, 
    is_valid_phone,
    source, 
    assigned_to, 
    (SELECT name FROM users WHERE id = leads.assigned_to) as assigned_user,
    created_at
FROM leads 
WHERE 
    created_at >= CURRENT_DATE
    AND (
        name ILIKE '%Karan%' OR
        name ILIKE '%Sani%' OR
        name ILIKE '%LKHVI%' OR
        name ILIKE '%Amandeep%' OR
        name ILIKE '%Khushi%' OR
        name ILIKE '%Harry%' OR
        name ILIKE '%Mohit%' OR
        name ILIKE '%Sukh%' OR
        name ILIKE '%Narinder%' OR
        name ILIKE '%Jashan%' OR
        name ILIKE '%Man_pree%' OR
        name ILIKE '%Bhardv%' OR
        name ILIKE '%Rupinder%' OR
        name ILIKE '%Pinder%' OR
        name ILIKE '%KHUSH%' OR
        name ILIKE '%Lovepreet%'
    )
ORDER BY created_at DESC;
