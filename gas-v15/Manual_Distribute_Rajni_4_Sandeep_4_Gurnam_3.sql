-- ============================================================================
-- 📥 MANUAL DISTRIBUTION: 11 Leads (Rajni 4, Sandeep 4, Gurnam 3)
-- ============================================================================

-- ============ RAJNI (4 Leads) ============

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Kamaldeep kaur', '+7888439359', 'Mansa', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'rajnikaler01@gmail.com';

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'ਅਮਨ', '+918284913323', 'Roopnagar', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'rajnikaler01@gmail.com';

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Jaiveer Shakya', '+916284703864', 'Abohar', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'rajnikaler01@gmail.com';

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'ਮੰਡ', '+917206391685', 'Ludhiana', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'rajnikaler01@gmail.com';

UPDATE users SET leads_today = leads_today + 4 
WHERE email = 'rajnikaler01@gmail.com';

-- ============ SANDEEP (4 Leads) ============

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Khush Brar', '+917086315466', 'Shri Muktsar sahib', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'sunnymehre451@gmail.com';

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Guri Saini', '+918283878338', 'Rupnagar', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'sunnymehre451@gmail.com';

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'khushi441951', '7404992442', 'Fatehabad', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'sunnymehre451@gmail.com';

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Amrinder Dhot', '8699404560', 'Patiala', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'sunnymehre451@gmail.com';

UPDATE users SET leads_today = leads_today + 4 
WHERE email = 'sunnymehre451@gmail.com';

-- ============ GURNAM (3 Leads) ============

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Pawan Mourya', '+917009046907', 'Ludhiana', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'gurnambal01@gmail.com';

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Gulzar_Gujjar307', '+917743024886', 'Patiala', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'gurnambal01@gmail.com';

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Waraich', '+919517219618', 'ਮਾਛੀਵਾੜਾ ਸਾਹਿਬ', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'gurnambal01@gmail.com';

UPDATE users SET leads_today = leads_today + 3 
WHERE email = 'gurnambal01@gmail.com';

-- ============ VERIFY ============
SELECT name, email, leads_today FROM users 
WHERE email IN ('rajnikaler01@gmail.com', 'sunnymehre451@gmail.com', 'gurnambal01@gmail.com');
