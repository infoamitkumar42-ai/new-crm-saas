-- ============================================================================
-- 📥 MANUAL DISTRIBUTION: 2 Leads to Rajwinder
-- Email: workwithrajwinder@gmail.com
-- ============================================================================

-- Step 1: Insert Lead 1
INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Jaswinder Janerian', '+918437373727', 'Faridkot', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'workwithrajwinder@gmail.com';

-- Step 2: Insert Lead 2
INSERT INTO leads (name, phone, city, user_id, status, source, assigned_at)
SELECT 'Gagan Surtia', '+917743034482', 'Sirsa', id, 'Assigned', 'Manual_Import', NOW()
FROM users WHERE email = 'workwithrajwinder@gmail.com';

-- Step 3: Update Lead Counter (+2)
UPDATE users SET leads_today = leads_today + 2 
WHERE email = 'workwithrajwinder@gmail.com';

-- Verify
SELECT name, email, leads_today FROM users WHERE email = 'workwithrajwinder@gmail.com';
