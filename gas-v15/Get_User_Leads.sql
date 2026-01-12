-- ============================================================================
-- 🕵️‍♂️ FETCH LEADS FOR USER (chouhansab64@gmail.com)
-- ============================================================================

SELECT 
    l.assigned_at,
    l.name as lead_name,
    l.phone,
    l.city,
    l.status,
    l.source,
    u.name as user_name,
    u.email
FROM leads l
JOIN users u ON l.user_id = u.id
WHERE u.email ILIKE 'chouhansab64@%'  -- ILIKE handles case sensitivity and potential typos (.ckm)
ORDER BY l.assigned_at DESC;
