-- ============================================================================
-- 📥 MANUAL DISTRIBUTION: 4 Leads to Rajni
-- Email: rajnikaler01@gmail.com
-- ============================================================================

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Itz Sidhu', '+919465889594', 'Ludhiana', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'rajnikaler01@gmail.com';

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'GURJINDER CHHAJAL', '+916239707658', 'Mohali', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'rajnikaler01@gmail.com';

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Harman Lahoria', '+919501805505', 'Rajpura', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'rajnikaler01@gmail.com';

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Sukh', '+917973326027', 'Abohar', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'rajnikaler01@gmail.com';

UPDATE users SET leads_today = leads_today + 4 
WHERE email = 'rajnikaler01@gmail.com';

SELECT name, email, leads_today FROM users WHERE email = 'rajnikaler01@gmail.com';
