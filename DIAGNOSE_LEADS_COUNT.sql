-- Find User ID for Himanshu Sharma
WITH target_user AS (
    SELECT id, name, email FROM users WHERE name ILIKE '%Himanshu%' LIMIT 1
)
SELECT 
    u.name,
    u.id as user_id,
    count(l.id) as total_leads,
    count(l.id) FILTER (WHERE l.status = 'Fresh') as fresh,
    count(l.id) FILTER (WHERE l.status = 'Contacted') as contacted,
    count(l.id) FILTER (WHERE l.status = 'Call Back') as callback,
    count(l.id) FILTER (WHERE l.status = 'Interested') as interested,
    count(l.id) FILTER (WHERE l.status = 'Follow-up') as followup,
    count(l.id) FILTER (WHERE l.status = 'Closed') as closed,
    count(l.id) FILTER (WHERE l.status = 'Rejected') as rejected,
    count(l.id) FILTER (WHERE l.status = 'Invalid') as invalid
FROM target_user u
LEFT JOIN leads l ON l.user_id = u.id
GROUP BY u.name, u.id;

-- Also check if there are 74 leads that might be assigned to him via 'assigned_to' but NOT 'user_id'
WITH target_user AS (
    SELECT id FROM users WHERE name ILIKE '%Himanshu%' LIMIT 1
)
SELECT count(*) as leads_with_mismatched_id 
FROM leads l, target_user u
WHERE l.assigned_to = u.id AND (l.user_id IS NULL OR l.user_id != u.id);
