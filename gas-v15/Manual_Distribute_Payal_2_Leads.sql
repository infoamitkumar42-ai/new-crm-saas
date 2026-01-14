-- ============================================================================
-- 📥 MANUAL DISTRIBUTION: 2 Leads to Payal
-- Email: payalpuri3299@gmail.com
-- ============================================================================

-- Lead 1
INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'CHOBBER', '+12533296339', 'Tandi aulakh', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'payalpuri3299@gmail.com';

-- Lead 2
INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Mrs.gill', '+12365583475', 'Surrey', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'payalpuri3299@gmail.com';

-- Update Lead Counter (+2)
UPDATE users SET leads_today = leads_today + 2 
WHERE email = 'payalpuri3299@gmail.com';

-- Verify
SELECT name, email, leads_today FROM users WHERE email = 'payalpuri3299@gmail.com';
