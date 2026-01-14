-- ============================================================================
-- 📥 MANUAL DISTRIBUTION: 6 Leads (4 Rajwinder, 2 Sandeep)
-- ============================================================================

-- ============ RAJWINDER (4 Leads) ============

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'its Neha Sandhu', '+919855263912', 'Amritsar', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'workwithrajwinder@gmail.com';

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Gurpreet Gopi', '+919914214341', 'Ludhiana', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'workwithrajwinder@gmail.com';

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Dhindsa', '+916239493505', 'Dohla', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'workwithrajwinder@gmail.com';

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Kuldeep Brar', '+918528844200', 'Bathinda', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'workwithrajwinder@gmail.com';

UPDATE users SET leads_today = leads_today + 4 
WHERE email = 'workwithrajwinder@gmail.com';

-- ============ SANDEEP (2 Leads) ============

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Gurpreet Singh', '+919592764645', 'Mansa', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'sunnymehre451@gmail.com';

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Sukhwinder Dhindsa', '+917889188518', 'Barnala', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'sunnymehre451@gmail.com';

UPDATE users SET leads_today = leads_today + 2 
WHERE email = 'sunnymehre451@gmail.com';

-- ============ VERIFY ============
SELECT name, email, leads_today FROM users 
WHERE email IN ('workwithrajwinder@gmail.com', 'sunnymehre451@gmail.com');
