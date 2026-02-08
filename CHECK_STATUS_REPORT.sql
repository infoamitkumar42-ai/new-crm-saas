
-- ============================================================================
-- 🕵️‍♂️ STUCK LEADS & YESTERDAY'S REPORT (2026-02-04)
-- ============================================================================

-- 1. ⚠️ CHECK STUCK LEADS (Currently Pending)
SELECT 
    COUNT(*) as stuck_leads_count,
    'Leads with status NEW or NULL Assigned' as description
FROM leads
WHERE status = 'New' OR assigned_to IS NULL;

-- 2. 📋 LIST STUCK LEADS (If any)
SELECT id, name, phone, source, created_at 
FROM leads 
WHERE status = 'New' OR assigned_to IS NULL
ORDER BY created_at DESC;

-- 3. 📅 YESTERDAY'S DELIVERY (Team-Wise Breakdown for 4th Feb)
--    Time Range: 2026-02-04 00:00:00 to 2026-02-04 23:59:59
SELECT 
    COALESCE(u.team_code, '❌ No Team') as team,
    COUNT(*) as leads_delivered
FROM leads l
LEFT JOIN users u ON l.assigned_to = u.id
WHERE l.created_at >= '2026-02-04 00:00:00' 
  AND l.created_at < '2026-02-05 00:00:00'
GROUP BY u.team_code
ORDER BY leads_delivered DESC;

-- 4. 📅 TODAY'S START (5th Feb - Early Morning Status)
SELECT 
    COALESCE(u.team_code, '❌ No Team') as team,
    COUNT(*) as leads_so_far_today
FROM leads l
LEFT JOIN users u ON l.assigned_to = u.id
WHERE l.created_at >= '2026-02-05 00:00:00'
GROUP BY u.team_code;
