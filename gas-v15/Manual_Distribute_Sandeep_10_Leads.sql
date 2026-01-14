-- ============================================================================
-- 📥 MANUAL DISTRIBUTION: 10 Leads to Sandeep
-- Email: sunnymehre451@gmail.com
-- ============================================================================

-- Lead 1
INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Inderpal M', '+919914', 'Maddoke', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'sunnymehre451@gmail.com';

-- Lead 2
INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'navi_samr', '+919878', 'Samrala', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'sunnymehre451@gmail.com';

-- Lead 3
INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Kulwant Si', '+919592', 'Malerkotla', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'sunnymehre451@gmail.com';

-- Lead 4
INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Vicky Jatt', '+918556', 'Pathankot', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'sunnymehre451@gmail.com';

-- Lead 5
INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Satnam', '+917009', 'Nabha', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'sunnymehre451@gmail.com';

-- Lead 6
INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Vicky', '+917087', 'Barnala', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'sunnymehre451@gmail.com';

-- Lead 7
INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Jass Gill', '+919872', 'Bathinda', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'sunnymehre451@gmail.com';

-- Lead 8
INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Amrit Wal', '+917508', 'Sangrur', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'sunnymehre451@gmail.com';

-- Lead 9
INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Sandhu', '+919056', 'Tarntaran', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'sunnymehre451@gmail.com';

-- Lead 10
INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Gurwinde', '+916284', 'Mansa', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'sunnymehre451@gmail.com';

-- Update Lead Counter (+10)
UPDATE users SET leads_today = leads_today + 10 
WHERE email = 'sunnymehre451@gmail.com';

-- Verify
SELECT name, email, leads_today FROM users WHERE email = 'sunnymehre451@gmail.com';
