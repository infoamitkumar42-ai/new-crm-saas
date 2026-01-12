-- ============================================================================
-- 🕵️‍♂️ PRIORITY LEAKAGE CHECK
-- ============================================================================

-- Did any 'Starter' get a 'Punjab' lead today?
-- (While Turbo users for Punjab were starving)

SELECT 
    l.id,
    l.city,
    l.state,
    l.assigned_at,
    u.name as assigned_to_user,
    u.plan_name,
    u.leads_today,
    u.target_state
FROM leads l
JOIN users u ON l.user_id = u.id
WHERE (l.assigned_at AT TIME ZONE 'Asia/Kolkata')::date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date
AND (l.state = 'Punjab' OR l.city ILIKE '%ludhiana%' OR l.city ILIKE '%amritsar%' OR l.city ILIKE '%jalandhar%')
AND u.plan_name = 'starter'
ORDER BY l.assigned_at DESC;

-- What about Gujarat/Chandigarh?
SELECT 
    l.id,
    l.city,
    l.state,
    l.assigned_at,
    u.name as assigned_to_user,
    u.plan_name
FROM leads l
JOIN users u ON l.user_id = u.id
WHERE (l.assigned_at AT TIME ZONE 'Asia/Kolkata')::date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date
AND (l.state IN ('Gujarat', 'Chandigarh'))
AND u.plan_name = 'starter';
