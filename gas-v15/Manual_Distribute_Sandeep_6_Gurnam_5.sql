-- ============================================================================
-- 📥 MANUAL DISTRIBUTION: 11 Leads (Sandeep 6, Gurnam 5)
-- ============================================================================

-- ============ SANDEEP (6 Leads) ============

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Bobby Sarai', '+917087341891', 'Amritsar', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'sunnymehre451@gmail.com';

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Sukhpal Singh Sukh', '+918146888761', 'Patiala', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'sunnymehre451@gmail.com';

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'GAGAN', '7814225402', 'Rajpura', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'sunnymehre451@gmail.com';

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Yadwinder Singh', '+919915126526', 'Barnala', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'sunnymehre451@gmail.com';

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'mandeep kaur', '+919023599975', 'Barnala', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'sunnymehre451@gmail.com';

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Manveer', '+918195067493', 'Ludhiana', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'sunnymehre451@gmail.com';

UPDATE users SET leads_today = leads_today + 6 
WHERE email = 'sunnymehre451@gmail.com';

-- ============ GURNAM (5 Leads) ============

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'deep Kaur', '9855766728', 'Samrala', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'gurnambal01@gmail.com';

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'JB', '8729002061', 'Barnala', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'gurnambal01@gmail.com';

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Sukhpal Singh', '+919012832965', 'Banda Shahjahanpur', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'gurnambal01@gmail.com';

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'ਰਣਜੀਤ ਹੰਸ', '+919588156320', 'Tohana', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'gurnambal01@gmail.com';

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Baljinder 8043', '+917347276881', 'Gurdaspur', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'gurnambal01@gmail.com';

UPDATE users SET leads_today = leads_today + 5 
WHERE email = 'gurnambal01@gmail.com';

-- ============ VERIFY ============
SELECT name, email, leads_today FROM users 
WHERE email IN ('sunnymehre451@gmail.com', 'gurnambal01@gmail.com');
