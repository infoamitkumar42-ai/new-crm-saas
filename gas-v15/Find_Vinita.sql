-- Search for Vinita to find her correct email address
SELECT id, name, email FROM users WHERE email ILIKE '%vinita%' OR name ILIKE '%vinita%';
