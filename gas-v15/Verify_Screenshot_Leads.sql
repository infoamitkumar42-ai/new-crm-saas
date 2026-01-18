-- FIND THE LEADS FROM YOUR SCREENSHOT
-- We are searching for the exact names you sent in the image.

SELECT 
    name as "Name (From Screenshot)",
    phone as "Phone Number",
    status as "Current Status",
    assigned_to as "Assigned To ID",
    (SELECT name FROM users WHERE id = leads.assigned_to) as "Assigned User Name",
    source as "Source",
    created_at as "Time Arrived"
FROM leads 
WHERE 
    created_at >= CURRENT_DATE
    AND (
        name ILIKE '%Karan%' OR
        name ILIKE '%Sani%' OR
        name ILIKE '%Amandeep%' OR
        name ILIKE '%Khushi%' OR
        name ILIKE '%Harry%' OR
        name ILIKE '%Mohit%' OR
        name ILIKE '%Sukh%' OR
        name ILIKE '%Narinder%' OR
        name ILIKE '%Jashan%' OR
        name ILIKE '%Rupinder%' OR
        name ILIKE '%Pinder%' OR
        name ILIKE '%Lovepreet%'
    )
ORDER BY created_at DESC;
