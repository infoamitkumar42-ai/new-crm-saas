-- ============================================================================
-- 📥 MANUAL DISTRIBUTION: 12 Leads to Rajwinder & Sandeep (6 each)
-- Rajwinder: workwithrajwinder@gmail.com
-- Sandeep: sunnymehre451@gmail.com
-- ============================================================================

-- ============ RAJWINDER (6 Leads) ============

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Jaswinderkaur Sampla', '+919877643264', 'Punjab', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'workwithrajwinder@gmail.com';

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'ਜਸਪ੍ਰੀਤ ਸਿੰਘ', '+8690110001', 'Nawanshahr Doaba', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'workwithrajwinder@gmail.com';

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Jatinder Kumar', '9465371798', 'Hoshiarpur', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'workwithrajwinder@gmail.com';

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Guri Dhillon', '+918360486514', 'Tarn Taran', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'workwithrajwinder@gmail.com';

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'AmritRohit', '+919914153488', 'Khanna', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'workwithrajwinder@gmail.com';

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Radhe Solanki', '+917888613520', 'Abohar', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'workwithrajwinder@gmail.com';

UPDATE users SET leads_today = leads_today + 6 
WHERE email = 'workwithrajwinder@gmail.com';

-- ============ SANDEEP (6 Leads) ============

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Vikrant Gill', '+918289060046', 'Patiala', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'sunnymehre451@gmail.com';

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Parneet Sandhu', '7009914124', 'Patiala', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'sunnymehre451@gmail.com';

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Preetjot', '+916239971967', 'Amritsar', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'sunnymehre451@gmail.com';

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Deep Mehmi', '+916280418534', 'Khanna', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'sunnymehre451@gmail.com';

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'sahiba', '6283568025', 'Jalandhar', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'sunnymehre451@gmail.com';

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Harkirat singh', '+916283967387', 'Patiala', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'sunnymehre451@gmail.com';

UPDATE users SET leads_today = leads_today + 6 
WHERE email = 'sunnymehre451@gmail.com';

-- ============ VERIFY ============
SELECT name, email, leads_today FROM users 
WHERE email IN ('workwithrajwinder@gmail.com', 'sunnymehre451@gmail.com');
