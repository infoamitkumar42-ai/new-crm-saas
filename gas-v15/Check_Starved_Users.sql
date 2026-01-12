-- ============================================================================
-- 🔎 CHECK STARVED USERS (Active but Hungry)
-- ============================================================================

SELECT 
    name, 
    email, 
    phone, 
    plan_name, 
    leads_today, 
    daily_limit, 
    (daily_limit - leads_today) as remaining_slots,
    last_lead_time,
    target_state,
    target_gender
FROM users 
WHERE payment_status = 'active'
AND is_active = true
AND leads_today < daily_limit
ORDER BY leads_today ASC, plan_name DESC;
