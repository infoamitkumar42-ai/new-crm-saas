-- Check if specific leads from the screenshot reached Supabase today
-- searching by partial name match to be safe

SELECT 
    id, 
    name, 
    phone, 
    city, 
    created_at, 
    source, 
    assigned_to, 
    (SELECT name FROM users WHERE id = leads.assigned_to) as assigned_user_name,
    status
FROM leads 
WHERE 
    created_at >= CURRENT_DATE
    AND (
        name ILIKE '%Karan%' OR
        name ILIKE '%Bhardv%' OR
        name ILIKE '%Amandeep%' OR
        name ILIKE '%Khushi%' OR
        name ILIKE '%Harry%' OR
        name ILIKE '%Mohit%' OR
        name ILIKE '%Sukh%' OR
        name ILIKE '%Narinder%' OR
        name ILIKE '%jashan%' OR
        name ILIKE '%man_preet%' OR
        name ILIKE '%Rupinder%' OR
        name ILIKE '%pinder%' OR
        name ILIKE '%Lovepreet%'
    )
ORDER BY created_at DESC;
