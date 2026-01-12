-- ============================================================================
-- 📊 SOURCE CHECK: MANUAL vs SYSTEM
-- ============================================================================

-- 1. Check Leads for Navjot (The one with 17)
SELECT 
    l.id, l.name, l.city, l.state, l.source, l.assigned_at
FROM leads l
JOIN users u ON l.user_id = u.id
WHERE u.email = 'knavjotkaur113@gmail.com'
AND (l.assigned_at AT TIME ZONE 'Asia/Kolkata')::date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date;

-- 2. Check Leads for Rajbir (The starving one)
SELECT 
    l.id, l.name, l.city, l.state, l.source, l.assigned_at
FROM leads l
JOIN users u ON l.user_id = u.id
WHERE u.email = 'rajbirsingh97843@gmail.com'
AND (l.assigned_at AT TIME ZONE 'Asia/Kolkata')::date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date;
