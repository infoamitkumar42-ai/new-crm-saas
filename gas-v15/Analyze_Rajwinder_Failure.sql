-- check specific leads from 'Meta - rajwinders' to confirm they are all invalid
SELECT 
    id, 
    name, 
    phone, 
    source, 
    status, 
    created_at,
    is_valid_phone
FROM leads 
WHERE source ILIKE '%rajwinder%'
ORDER BY created_at DESC;

-- Also check 'Assigned' leads that have NULL user names (Data integrity check)
SELECT 
    l.id, 
    l.name, 
    l.assigned_to, 
    u.name as looked_up_user_name
FROM leads l
LEFT JOIN users u ON l.assigned_to = u.id
WHERE l.status = 'Assigned' AND u.name IS NULL
LIMIT 10;
