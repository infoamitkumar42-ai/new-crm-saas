-- Step 1: Broad search for anyone named Rajwinder
SELECT id, name, email, role, manager_id 
FROM users 
WHERE name ILIKE '%Rajwinder%' OR email ILIKE '%rajwinder%';

-- Step 2: Just in case, list all managers to see if she is listed differently
SELECT id, name, email, role 
FROM users 
WHERE role = 'manager' 
LIMIT 20;
