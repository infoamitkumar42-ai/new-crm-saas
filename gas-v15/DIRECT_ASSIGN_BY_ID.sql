-- DIRECT ASSIGNMENT BY LEAD ID - 100% WORKING
-- Using exact Lead IDs from the 17 unassigned leads we found earlier

-- Rajwinder Singh (10 leads) - IDs 1-10
UPDATE leads SET 
    assigned_to = (SELECT id FROM users WHERE email = 'workwithrajwinder@gmail.com'),
    user_id = (SELECT id FROM users WHERE email = 'workwithrajwinder@gmail.com'),
    status = 'Assigned',
    assigned_at = NOW()
WHERE id IN (
    '91b75a63-4e33-47aa-b794-2c2d97825747',
    'e6dfcbef-eaaf-441f-b2b4-042fda6e2257',
    '30745d9e-c158-4382-b151-cde5129beaf3',
    'd6e1a741-cf3b-48e1-9e81-c5af5725bd7e',
    '2bd498e9-c258-440c-bc17-43d8172a2f01',
    '73bb44ef-6bd2-4987-af9f-e268a7a14447',
    '05bd7f91-0cae-404f-91e1-c63cbc8e5344',
    'cfe0c7f9-6146-441c-8f4c-f7a015630128',
    'da7392a0-ca81-4822-b85f-e3882ca5bc05',
    '1ee5f892-3ec4-4fbb-8357-37a20b1aaea5'
);

-- Sandeep (7 leads) - IDs 11-17
UPDATE leads SET 
    assigned_to = (SELECT id FROM users WHERE email = 'sunnymehre451@gmail.com'),
    user_id = (SELECT id FROM users WHERE email = 'sunnymehre451@gmail.com'),
    status = 'Assigned',
    assigned_at = NOW()
WHERE id IN (
    'd1cb094e-af0a-46b8-966d-75991c923dd3',
    '150ea1df-206b-4303-800c-1c3657d9c491',
    'f7c08167-37c6-43ef-ad82-12c3281e6467',
    'bf84b712-2581-4e79-85ed-6b140af23f42',
    'e9961057-327b-4002-bbdb-a2feca341a55',
    'bd17d67b-1241-49f9-b2ef-28a69222621f',
    'c1ed549f-971c-4adf-a72f-d9115dd3e6da'
);

-- VERIFY
SELECT 
    (SELECT name FROM users WHERE email = 'workwithrajwinder@gmail.com') as user_name,
    'workwithrajwinder@gmail.com' as email,
    COUNT(*) as leads_count
FROM leads 
WHERE assigned_to = (SELECT id FROM users WHERE email = 'workwithrajwinder@gmail.com')
AND assigned_at >= NOW() - INTERVAL '5 minutes'

UNION ALL

SELECT 
    (SELECT name FROM users WHERE email = 'sunnymehre451@gmail.com'),
    'sunnymehre451@gmail.com',
    COUNT(*)
FROM leads 
WHERE assigned_to = (SELECT id FROM users WHERE email = 'sunnymehre451@gmail.com')
AND assigned_at >= NOW() - INTERVAL '5 minutes';
