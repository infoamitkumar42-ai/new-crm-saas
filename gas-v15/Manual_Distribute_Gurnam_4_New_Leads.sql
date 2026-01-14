-- ============================================================================
-- 📥 MANUAL DISTRIBUTION: 4 Leads to Gurnam
-- Email: gurnambal01@gmail.com
-- ============================================================================

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Amrit Gill', '+919888116911', 'Ludhiana', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'gurnambal01@gmail.com';

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Manpreet', '+917901703484', 'Amritsar', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'gurnambal01@gmail.com';

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Karmjeet', '+916284958920', 'Malerkotla', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'gurnambal01@gmail.com';

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Gurdev Singh Parmar', '+917696500364', 'Batala', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'gurnambal01@gmail.com';

UPDATE users SET leads_today = leads_today + 4 
WHERE email = 'gurnambal01@gmail.com';

SELECT name, email, leads_today FROM users WHERE email = 'gurnambal01@gmail.com';
