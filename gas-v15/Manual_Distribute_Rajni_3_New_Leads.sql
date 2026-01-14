-- ============================================================================
-- 📥 MANUAL DISTRIBUTION: 3 Leads to Rajni
-- Email: rajnikaler01@gmail.com
-- ============================================================================

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Krishan kumar', '7986558079', 'Bathinda', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'rajnikaler01@gmail.com';

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Guri Khera', '+917814886133', 'Machiwara', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'rajnikaler01@gmail.com';

INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'lavi sharma', '+916280191623', 'Bathinda', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'rajnikaler01@gmail.com';

UPDATE users SET leads_today = leads_today + 3 
WHERE email = 'rajnikaler01@gmail.com';

SELECT name, email, leads_today FROM users WHERE email = 'rajnikaler01@gmail.com';
