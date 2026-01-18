-- Check Rajwinder's Team Eligibility
-- Manager ID: 1f4ab7b6-583d-4db8-9866-fbef457eea98

SELECT 
    id, 
    name, 
    email, 
    role, 
    is_active, 
    payment_status,
    daily_limit,
    leads_today,
    (daily_limit - leads_today) as remaining_limit,
    valid_until
FROM users 
WHERE 
    manager_id = '1f4ab7b6-583d-4db8-9866-fbef457eea98' 
    OR id = '1f4ab7b6-583d-4db8-9866-fbef457eea98';
