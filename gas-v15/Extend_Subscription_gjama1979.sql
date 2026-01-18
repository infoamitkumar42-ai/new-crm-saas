-- Extend subscription for gjama1979@gmail.com by 6 days
-- Logic: Adds 6 days to the CURRENT TIME if expired, or extends existing VALIDITY if active.
-- V2: Removed payment_status update to avoid check constraint violation.

UPDATE users
SET 
  valid_until = GREATEST(NOW(), valid_until) + INTERVAL '6 days',
  days_extended = COALESCE(days_extended, 0) + 6,
  is_active = true       -- Reactivate if they were inactive
WHERE email = 'gjama1979@gmail.com';

-- Verify the update
SELECT id, email, valid_until, days_extended, is_active, payment_status 
FROM users 
WHERE email = 'gjama1979@gmail.com';
