-- Show the 4 Invalid Leads from Rajwinder so you can manually extract them if needed
SELECT 
    id, 
    name, 
    phone, 
    city, 
    source, 
    status, 
    created_at 
FROM leads 
WHERE source ILIKE '%rajwinder%' AND status = 'Invalid'
ORDER BY created_at DESC;
