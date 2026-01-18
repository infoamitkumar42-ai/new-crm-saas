-- Step 1: Get User IDs for Rajwinder and Sandeep
SELECT id, name, email FROM users 
WHERE email IN ('workwithrajwinder@gmail.com', 'sunnymehre451@gmail.com');

-- Step 2: Assign 10 leads to Rajwinder Singh
-- (Replace USER_ID_RAJWINDER with actual ID from Step 1)
UPDATE leads
SET 
    assigned_to = (SELECT id FROM users WHERE email = 'workwithrajwinder@gmail.com'),
    user_id = (SELECT id FROM users WHERE email = 'workwithrajwinder@gmail.com'),
    status = 'Assigned',
    assigned_at = NOW()
WHERE id IN (
    SELECT id FROM leads 
    WHERE 
        created_at >= '2026-01-16 00:00:00' 
        AND created_at < '2026-01-17 00:00:00'
        AND status IN ('New', 'Night_Backlog')
        AND (
            name ILIKE '%Ravinder%' OR name ILIKE '%Taran%' OR name ILIKE '%Tannu%' OR
            name ILIKE '%Veerpal%' OR name ILIKE '%jass%' OR name ILIKE '%Laddi%' OR
            name ILIKE '%Gurwind%' OR name ILIKE '%Inderjit%' OR name ILIKE '%Vikramjit%' OR
            name ILIKE '%Karan%' OR name ILIKE '%Sani%' OR name ILIKE '%virdi%' OR
            name ILIKE '%Amandeep%' OR name ILIKE '%Khushi%' OR name ILIKE '%Harry%' OR
            name ILIKE '%Mohit%' OR name ILIKE '%Sukh%' OR name ILIKE '%Lakh%' OR
            name ILIKE '%Narinder%' OR name ILIKE '%jashan%' OR name ILIKE '%man_preet%' OR
            name ILIKE '%Bhardv%' OR name ILIKE '%Rupinder%' OR name ILIKE '%pinder%' OR
            name ILIKE '%KHUSH%' OR name ILIKE '%Lovepreet%'
        )
    ORDER BY created_at DESC
    LIMIT 10
);

-- Step 3: Assign remaining 7 leads to Sandeep
UPDATE leads
SET 
    assigned_to = (SELECT id FROM users WHERE email = 'sunnymehre451@gmail.com'),
    user_id = (SELECT id FROM users WHERE email = 'sunnymehre451@gmail.com'),
    status = 'Assigned',
    assigned_at = NOW()
WHERE id IN (
    SELECT id FROM leads 
    WHERE 
        created_at >= '2026-01-16 00:00:00' 
        AND created_at < '2026-01-17 00:00:00'
        AND status IN ('New', 'Night_Backlog')
        AND assigned_to IS NULL  -- Only unassigned ones
        AND (
            name ILIKE '%Ravinder%' OR name ILIKE '%Taran%' OR name ILIKE '%Tannu%' OR
            name ILIKE '%Veerpal%' OR name ILIKE '%jass%' OR name ILIKE '%Laddi%' OR
            name ILIKE '%Gurwind%' OR name ILIKE '%Inderjit%' OR name ILIKE '%Vikramjit%' OR
            name ILIKE '%Karan%' OR name ILIKE '%Sani%' OR name ILIKE '%virdi%' OR
            name ILIKE '%Amandeep%' OR name ILIKE '%Khushi%' OR name ILIKE '%Harry%' OR
            name ILIKE '%Mohit%' OR name ILIKE '%Sukh%' OR name ILIKE '%Lakh%' OR
            name ILIKE '%Narinder%' OR name ILIKE '%jashan%' OR name ILIKE '%man_preet%' OR
            name ILIKE '%Bhardv%' OR name ILIKE '%Rupinder%' OR name ILIKE '%pinder%' OR
            name ILIKE '%KHUSH%' OR name ILIKE '%Lovepreet%'
        )
    ORDER BY created_at DESC
    LIMIT 7
);

-- Step 4: Verify assignments
SELECT 
    u.name as assigned_user,
    u.email,
    COUNT(l.id) as leads_assigned
FROM leads l
JOIN users u ON l.assigned_to = u.id
WHERE 
    l.created_at >= '2026-01-16 00:00:00' 
    AND l.created_at < '2026-01-17 00:00:00'
    AND u.email IN ('workwithrajwinder@gmail.com', 'sunnymehre451@gmail.com')
    AND l.assigned_at >= NOW() - INTERVAL '5 minutes'
GROUP BY u.name, u.email;
