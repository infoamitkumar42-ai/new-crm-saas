-- ============================================================================
-- 📥 MANUAL DISTRIBUTION: 8 Leads to Gurnam
-- Email: gurnambal01@gmail.com
-- ============================================================================

-- Lead 1
INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Karamvir I', '+917380', 'Jalandhar', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'gurnambal01@gmail.com';

-- Lead 2
INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Fateh Sing', '9465038', 'Punjab', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'gurnambal01@gmail.com';

-- Lead 3
INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Balraj_cric', '+917719', 'Ludhiana', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'gurnambal01@gmail.com';

-- Lead 4
INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Mohd Mo', '+918427', 'Malerkotla', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'gurnambal01@gmail.com';

-- Lead 5
INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Bratch Saa', '+918360', 'Phagwara', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'gurnambal01@gmail.com';

-- Lead 6
INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Daljeet Gr', '+917837', 'Bathinda', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'gurnambal01@gmail.com';

-- Lead 7
INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'ARMAAN', '7009250', 'Sangrur', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'gurnambal01@gmail.com';

-- Lead 8
INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Akashdeel', '+919646', 'Amritsar', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'gurnambal01@gmail.com';

-- Update Lead Counter (+8)
UPDATE users SET leads_today = leads_today + 8 
WHERE email = 'gurnambal01@gmail.com';

-- Verify
SELECT name, email, leads_today FROM users WHERE email = 'gurnambal01@gmail.com';
