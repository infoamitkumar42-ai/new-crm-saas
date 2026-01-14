-- ============================================================================
-- 🔍 DIAGNOSTIC: Lead Filter & Distribution Analysis
-- ============================================================================

-- 1. How many leads came in today (total)?
SELECT 
    'TOTAL LEADS TODAY' as metric,
    COUNT(*) as count
FROM leads 
WHERE created_at >= CURRENT_DATE;

-- 2. How many got ASSIGNED vs UNASSIGNED?
SELECT 
    status,
    COUNT(*) as count
FROM leads 
WHERE created_at >= CURRENT_DATE
GROUP BY status;

-- 3. Source breakdown (where are leads coming from?)
SELECT 
    COALESCE(source, 'Meta/Facebook') as source,
    COUNT(*) as count
FROM leads 
WHERE created_at >= CURRENT_DATE
GROUP BY source
ORDER BY count DESC;

-- 4. Check if any leads are stuck/pending
SELECT 
    id,
    name,
    phone,
    city,
    status,
    created_at
FROM leads 
WHERE created_at >= CURRENT_DATE 
  AND status IN ('New', 'Pending', 'Unassigned')
ORDER BY created_at DESC
LIMIT 20;

-- 5. Users who got MOST leads (check for repeat issue)
SELECT 
    u.name,
    u.plan_name,
    u.leads_today,
    u.daily_limit,
    COUNT(l.id) as actual_leads_from_db
FROM users u
LEFT JOIN leads l ON u.id = l.user_id AND l.assigned_at >= CURRENT_DATE
WHERE u.is_active = true AND u.plan_name != 'none'
GROUP BY u.id, u.name, u.plan_name, u.leads_today, u.daily_limit
ORDER BY actual_leads_from_db DESC
LIMIT 15;
