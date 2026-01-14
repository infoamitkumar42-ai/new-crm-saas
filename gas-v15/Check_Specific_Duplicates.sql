-- ============================================================================
-- 🔍 CHECK SPECIFIC DUPLICATE NUMBERS (From User's List)
-- ============================================================================

-- Check these specific phone numbers - who has them?
SELECT 
    l.phone,
    l.name as lead_name,
    u.name as assigned_to,
    u.email,
    l.created_at
FROM leads l
JOIN users u ON l.user_id = u.id
WHERE l.phone LIKE '%8894114349%'
   OR l.phone LIKE '%8146896443%'
   OR l.phone LIKE '%9872795169%'
   OR l.phone LIKE '%9357294136%'
   OR l.phone LIKE '%7087273762%'
   OR l.phone LIKE '%8699216649%'
   OR l.phone LIKE '%7814023117%'
ORDER BY l.phone, u.email;
