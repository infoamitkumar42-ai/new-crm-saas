-- ============================================================================
-- 🔍 VERIFICATION QUERIES - Test Lead Processing
-- ============================================================================

-- Query 1: Test Token Status (Run this first)
SELECT 
    page_id,
    page_name,
    CASE 
        WHEN access_token IS NULL THEN '❌ FAIL - No token'
        WHEN LENGTH(access_token) < 100 THEN '⚠️ WARN - Token too short'
        ELSE '✅ PASS - Token ready'
    END as token_status,
    LENGTH(access_token) as token_length
FROM meta_pages
WHERE team_id = 'TEAMFIRE'
ORDER BY page_name;

-- Query 2: Monitor New Leads (Run after test lead)
-- Shows last 10 leads with timestamps
SELECT 
    id,
    name,
    phone,
    city,
    source,
    status,
    assigned_to,
    created_at
FROM leads
ORDER BY created_at DESC
LIMIT 10;

-- Query 3: Check for New Errors (Run after test lead)
-- If empty = success! If has rows = problem!
SELECT 
    error_type,
    details,
    created_at
FROM webhook_errors
WHERE created_at >= NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC;

-- Query 4: Real-time Lead Counter Check
-- Compare actual vs counter after test lead
SELECT 
    u.name,
    u.email,
    u.total_leads_received as counter,
    (SELECT COUNT(*) FROM leads WHERE assigned_to = u.id) as actual_count,
    CASE 
        WHEN u.total_leads_received = (SELECT COUNT(*) FROM leads WHERE assigned_to = u.id) 
        THEN '✅ SYNCED' 
        ELSE '❌ OUT OF SYNC' 
    END as sync_status
FROM users u
WHERE u.team_code = 'TEAMFIRE' 
  AND u.is_active = true
ORDER BY actual_count DESC
LIMIT 5;

-- Query 5: Today's Assignment Stats
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN assigned_to IS NOT NULL THEN 1 END) as assigned,
    COUNT(CASE WHEN assigned_to IS NULL THEN 1 END) as unassigned,
    COUNT(CASE WHEN status = 'Queued' THEN 1 END) as queued
FROM leads
WHERE created_at >= CURRENT_DATE
GROUP BY DATE(created_at);
