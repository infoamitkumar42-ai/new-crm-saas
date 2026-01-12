-- ============================================================================
-- 🕵️‍♂️ IDENTIFY PAYER FOR TRANSACTION: 7dac4953...
-- ============================================================================

SELECT 
    p.amount,
    p.status,
    p.created_at,
    -- User Details from Users Table
    u.name as user_name,
    u.email as user_email,
    u.phone as user_phone,
    u.plan_name as assigned_plan
FROM payments p
LEFT JOIN users u ON p.user_id = u.id
WHERE 
    p.id = '7dac4953-c7e1-446d-8a7a-757e283ff9d9';
