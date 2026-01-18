-- Fresh Assignment Script with COMPLETE Phone Numbers
-- 8 leads total: 4 to Rajni, 4 to Gurnam

-- Step 1: Find these 8 specific leads by exact phone match
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
    phone IN (
        '7973360551',  -- diljaan bh
        '7087567294',  -- Ramy
        '9877895047',  -- Simranjit
        '8360606359',  -- Sharma
        '9872612324',  -- Sony singh
        '9888322174',  -- (unclear name)
        '7986754610',  -- (Punjabi name)
        '7625886593'   -- Daljit Singh
    )
    AND status NOT IN ('Invalid', 'Duplicate')
ORDER BY created_at DESC;

-- Step 2: Assign first 4 to Rajni
UPDATE leads
SET 
    assigned_to = (SELECT id FROM users WHERE email = 'rajnikaler01@gmail.com'),
    user_id = (SELECT id FROM users WHERE email = 'rajnikaler01@gmail.com'),
    status = 'Assigned',
    assigned_at = NOW()
WHERE phone IN (
    '7973360551',  -- diljaan bh
    '7087567294',  -- Ramy
    '9877895047',  -- Simranjit
    '8360606359'   -- Sharma
)
AND status NOT IN ('Invalid', 'Duplicate', 'Assigned')
AND assigned_to IS NULL;

-- Step 3: Assign remaining 4 to Gurnam
UPDATE leads
SET 
    assigned_to = (SELECT id FROM users WHERE email = 'gurnambal01@gmail.com'),
    user_id = (SELECT id FROM users WHERE email = 'gurnambal01@gmail.com'),
    status = 'Assigned',
    assigned_at = NOW()
WHERE phone IN (
    '9872612324',  -- Sony singh
    '9888322174',  -- (unclear name)
    '7986754610',  -- (Punjabi name)
    '7625886593'   -- Daljit Singh
)
AND status NOT IN ('Invalid', 'Duplicate', 'Assigned')
AND assigned_to IS NULL;

-- Step 4: Verify Final Assignment
SELECT 
    u.name as assigned_user,
    u.email,
    l.name as lead_name,
    l.phone,
    l.status,
    l.assigned_at
FROM leads l
JOIN users u ON l.assigned_to = u.id
WHERE 
    l.phone IN (
        '7973360551', '7087567294', '9877895047', '8360606359',
        '9872612324', '9888322174', '7986754610', '7625886593'
    )
ORDER BY u.email, l.assigned_at DESC;
