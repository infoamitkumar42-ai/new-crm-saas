-- Step 1: First, let's find if these 8 leads even exist in our database
-- Using exact phone numbers from screenshot

SELECT 
    id,
    name,
    phone,
    city,
    status,
    assigned_to,
    (SELECT name FROM users WHERE id = leads.assigned_to) as assigned_user_name,
    created_at
FROM leads 
WHERE 
    phone IN (
        '9179739',  -- diljaan bh (Sultanpur)
        '9170873',  -- Ramy (Amritsar)
        '9198772',  -- Simranjit (Hoshiarpur)
        '9183602',  -- Sharma (Ludhiana)
        '9198728',  -- Sony singh (Fazilka)
        '9198888',  -- (Muktsar)
        '7986754',  -- (Ludhiana)
        '9176256'   -- Daljit Singh (Amritsar)
    )
ORDER BY created_at DESC;

-- If above doesn't work, try with partial phone match
SELECT 
    id,
    name,
    phone,
    city,
    status,
    assigned_to,
    created_at
FROM leads 
WHERE 
    created_at >= '2026-01-16 00:00:00'
    AND (
        phone LIKE '%79739%' OR 
        phone LIKE '%70873%' OR 
        phone LIKE '%98772%' OR 
        phone LIKE '%83602%' OR 
        phone LIKE '%98728%' OR 
        phone LIKE '%98888%' OR 
        phone LIKE '%86754%' OR 
        phone LIKE '%76256%'
    )
ORDER BY created_at DESC;
