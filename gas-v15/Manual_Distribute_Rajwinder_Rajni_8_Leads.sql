-- ============================================================================
-- 📥 MANUAL DISTRIBUTION: 8 Leads to Rajwinder & Rajni (4 each)
-- Rajwinder: workwithrajwinder@gmail.com
-- Rajni: rajnikaler01@gmail.com
-- ============================================================================

-- ============ RAJWINDER (4 Leads) ============

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Harman Arora', '9779006433', 'Faridkot', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'workwithrajwinder@gmail.com';

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Avtar Singh', '+919463208086', 'Bathinda', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'workwithrajwinder@gmail.com';

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Akashdeep', '+918146504202', 'Nakodar', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'workwithrajwinder@gmail.com';

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Hardeep Singh Sandhu', '+916006741084', 'Madhopur', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'workwithrajwinder@gmail.com';

UPDATE users SET leads_today = leads_today + 4 
WHERE email = 'workwithrajwinder@gmail.com';

-- ============ RAJNI (4 Leads) ============

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Narinder kaur', '+919465493870', 'Morinda', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'rajnikaler01@gmail.com';

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Dharminder Singh Dhram', '+918284028103', 'Punjab', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'rajnikaler01@gmail.com';

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Jagjeet Singh', '+916283099208', 'Tarn Taran', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'rajnikaler01@gmail.com';

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Jasveer Singh', '+918872156883', 'Ludhiana', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'rajnikaler01@gmail.com';

UPDATE users SET leads_today = leads_today + 4 
WHERE email = 'rajnikaler01@gmail.com';

-- ============ VERIFY ============
SELECT name, email, leads_today FROM users 
WHERE email IN ('workwithrajwinder@gmail.com', 'rajnikaler01@gmail.com');
