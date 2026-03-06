-- ============================================================================
-- CHECK ORPHAN LEADS (Leads not assigned to any active user)
-- ============================================================================

-- 1. Total orphan leads count (assigned_to is NULL or user doesn't exist)
SELECT 
    'Orphan Leads Summary' as report,
    COUNT(*) as total_orphan_leads
FROM leads l
WHERE 
    l.assigned_to IS NULL 
    OR NOT EXISTS (SELECT 1 FROM users u WHERE u.id = l.assigned_to);

-- 2. Breakdown: NULL assigned_to vs user not found
SELECT 
    CASE 
        WHEN l.assigned_to IS NULL THEN '❌ assigned_to is NULL'
        WHEN NOT EXISTS (SELECT 1 FROM users u WHERE u.id = l.assigned_to) THEN '⚠️ User not found in users table'
        ELSE '✅ Valid'
    END as orphan_type,
    COUNT(*) as lead_count
FROM leads l
WHERE 
    l.assigned_to IS NULL 
    OR NOT EXISTS (SELECT 1 FROM users u WHERE u.id = l.assigned_to)
GROUP BY orphan_type
ORDER BY lead_count DESC;

-- 3. Orphan leads where user_id also doesn't exist
SELECT 
    'Double Orphan (both user_id & assigned_to invalid)' as report,
    COUNT(*) as count
FROM leads l
WHERE 
    (l.assigned_to IS NULL OR NOT EXISTS (SELECT 1 FROM users u WHERE u.id = l.assigned_to))
    AND (l.user_id IS NULL OR NOT EXISTS (SELECT 1 FROM users u WHERE u.id = l.user_id));

-- 4. Recent orphan leads (last 30 days) with details
SELECT 
    l.id,
    l.name,
    l.phone,
    l.city,
    l.status,
    l.source,
    l.created_at,
    l.assigned_to,
    l.user_id,
    CASE 
        WHEN l.assigned_to IS NULL THEN 'NULL assigned_to'
        ELSE 'User deleted/missing'
    END as reason
FROM leads l
WHERE 
    (l.assigned_to IS NULL 
     OR NOT EXISTS (SELECT 1 FROM users u WHERE u.id = l.assigned_to))
    AND l.created_at >= NOW() - INTERVAL '30 days'
ORDER BY l.created_at DESC
LIMIT 50;

-- 5. Also check: Leads assigned to INACTIVE users (not truly orphan but stuck)
SELECT 
    'Leads assigned to INACTIVE users' as report,
    COUNT(*) as count
FROM leads l
JOIN users u ON u.id = l.assigned_to
WHERE u.is_active = false OR u.payment_status != 'active';
