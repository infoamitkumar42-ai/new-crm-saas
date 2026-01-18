-- Step 1: Find the 8 leads from the screenshot (by partial phone match)
SELECT 
    id,
    name,
    phone,
    city,
    status,
    created_at
FROM leads 
WHERE 
    -- Match phone numbers from screenshot (last 6-7 digits)
    (
        phone LIKE '%179739%' OR  -- diljaan bh
        phone LIKE '%170873%' OR  -- Ramy
        phone LIKE '%198772%' OR  -- Simranjit
        phone LIKE '%183602%' OR  -- Sharma
        phone LIKE '%198728%' OR  -- Sony singh
        phone LIKE '%198888%' OR  -- (name unclear)
        phone LIKE '%986754%' OR  -- (Punjabi name)
        phone LIKE '%176256%'     -- Daljit Singh
    )
    AND status NOT IN ('Invalid', 'Duplicate')
    AND assigned_to IS NULL
    AND created_at >= '2026-01-16 00:00:00'
ORDER BY created_at DESC;

-- Step 2: Assign 4 leads to Rajni
UPDATE leads
SET 
    assigned_to = (SELECT id FROM users WHERE email = 'rajnikaler01@gmail.com'),
    user_id = (SELECT id FROM users WHERE email = 'rajnikaler01@gmail.com'),
    status = 'Assigned',
    assigned_at = NOW()
WHERE id IN (
    SELECT id FROM leads 
    WHERE 
        (
            phone LIKE '%179739%' OR phone LIKE '%170873%' OR 
            phone LIKE '%198772%' OR phone LIKE '%183602%' OR 
            phone LIKE '%198728%' OR phone LIKE '%198888%' OR 
            phone LIKE '%986754%' OR phone LIKE '%176256%'
        )
        AND status NOT IN ('Invalid', 'Duplicate', 'Assigned')
        AND assigned_to IS NULL
        AND created_at >= '2026-01-16 00:00:00'
    ORDER BY created_at DESC
    LIMIT 4
);

-- Step 3: Assign remaining 4 leads to Gurnam
UPDATE leads
SET 
    assigned_to = (SELECT id FROM users WHERE email = 'gurnambal01@gmail.com'),
    user_id = (SELECT id FROM users WHERE email = 'gurnambal01@gmail.com'),
    status = 'Assigned',
    assigned_at = NOW()
WHERE id IN (
    SELECT id FROM leads 
    WHERE 
        (
            phone LIKE '%179739%' OR phone LIKE '%170873%' OR 
            phone LIKE '%198772%' OR phone LIKE '%183602%' OR 
            phone LIKE '%198728%' OR phone LIKE '%198888%' OR 
            phone LIKE '%986754%' OR phone LIKE '%176256%'
        )
        AND status NOT IN ('Invalid', 'Duplicate', 'Assigned')
        AND assigned_to IS NULL
        AND created_at >= '2026-01-16 00:00:00'
    ORDER BY created_at DESC
    LIMIT 4
);

-- Step 4: Verify assignments
SELECT 
    u.name as assigned_user,
    u.email,
    COUNT(l.id) as leads_assigned,
    STRING_AGG(l.name, ', ') as lead_names
FROM leads l
JOIN users u ON l.assigned_to = u.id
WHERE 
    u.email IN ('rajnikaler01@gmail.com', 'gurnambal01@gmail.com')
    AND l.assigned_at >= NOW() - INTERVAL '5 minutes'
GROUP BY u.name, u.email;
