-- ============================================================================
-- 📥 MANUAL DISTRIBUTION: 10 Leads to Rajwinder
-- Email: workwithrajwinder@gmail.com
-- ============================================================================

-- Lead 1
INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'ਪ੍ਰਧਾਨ ਸਾਬ', '+919041', 'Sirhind', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'workwithrajwinder@gmail.com';

-- Lead 2
INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Manpreet', '+919463', 'Sirhind', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'workwithrajwinder@gmail.com';

-- Lead 3
INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Sahil Balar', '+919814', 'Fazilka', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'workwithrajwinder@gmail.com';

-- Lead 4
INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Simrande', '8196078', 'Khanna', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'workwithrajwinder@gmail.com';

-- Lead 5
INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Abhaynoo', '9592324', 'Punjab', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'workwithrajwinder@gmail.com';

-- Lead 6
INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Mandeep', '+917347', 'Phillaur', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'workwithrajwinder@gmail.com';

-- Lead 7
INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Harshdeep', '+919914', 'Chandigarh', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'workwithrajwinder@gmail.com';

-- Lead 8
INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Yadwinde', '9877902', 'Barnala', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'workwithrajwinder@gmail.com';

-- Lead 9
INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Sukhpinde', '+919779', 'Ludhiana', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'workwithrajwinder@gmail.com';

-- Lead 10
INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'SANJANA_', '+919056', 'Rajpura', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'workwithrajwinder@gmail.com';

-- Update Lead Counter (+10)
UPDATE users SET leads_today = leads_today + 10 
WHERE email = 'workwithrajwinder@gmail.com';

-- Verify
SELECT name, email, leads_today FROM users WHERE email = 'workwithrajwinder@gmail.com';
