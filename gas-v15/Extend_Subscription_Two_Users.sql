-- Extend subscription for Punjabivinita83@gmail.com and ravenjeetkaur@gmail.com by 7 days
-- Logic: Adds 7 days to the CURRENT TIME if expired, or extends existing VALIDITY if active.

UPDATE users
SET 
  valid_until = GREATEST(NOW(), valid_until) + INTERVAL '7 days',
  days_extended = COALESCE(days_extended, 0) + 7,
  is_active = true       -- Reactivate if they were inactive
WHERE email IN ('Punjabivinita83@gmail.com', 'ravenjeetkaur@gmail.com');

-- Verify the update
SELECT id, name, email, valid_until, days_extended, is_active 
FROM users 
WHERE email IN ('Punjabivinita83@gmail.com', 'ravenjeetkaur@gmail.com');
