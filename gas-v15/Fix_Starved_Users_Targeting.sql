-- ============================================================================
-- 🔓 UNBLOCK STARVED USERS (Widen Net to 'All India')
-- ============================================================================

-- Updates target_state to 'All India' for active users who have 0-2 leads today
-- and are currently waiting for leads (mostly Punjab users)

UPDATE users
SET target_state = 'All India'
WHERE payment_status = 'active'
AND is_active = true
AND leads_today < daily_limit
AND leads_today <= 2  -- Only targeting those who are starving
AND target_state != 'All India';  -- Don't update if already set

-- Verify the change
SELECT name, email, target_state, leads_today 
FROM users 
WHERE leads_today <= 2 
AND payment_status = 'active';
