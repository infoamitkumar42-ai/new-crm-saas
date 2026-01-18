-- FIX: Update leads_today counter for Rajwinder & Sandeep

-- Update Rajwinder's leads_today (+10)
UPDATE users 
SET leads_today = COALESCE(leads_today, 0) + 10
WHERE email = 'workwithrajwinder@gmail.com';

-- Update Sandeep's leads_today (+7)
UPDATE users 
SET leads_today = COALESCE(leads_today, 0) + 7
WHERE email = 'sunnymehre451@gmail.com';

-- Verify updated counts
SELECT name, email, leads_today, daily_limit 
FROM users 
WHERE email IN ('workwithrajwinder@gmail.com', 'sunnymehre451@gmail.com');
