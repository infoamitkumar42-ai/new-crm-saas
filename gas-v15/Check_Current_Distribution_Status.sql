-- ============================================================================
-- 📊 CURRENT DISTRIBUTION STATUS (Full Snapshot)
-- ============================================================================

-- Summary by Lead Count (How many users at each level)
SELECT 
    leads_today,
    COUNT(*) as user_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage
FROM users 
WHERE is_active = true
GROUP BY leads_today
ORDER BY leads_today DESC;

-- Plan-wise Breakdown
SELECT 
    plan_name,
    COUNT(*) as total_users,
    SUM(leads_today) as total_leads,
    ROUND(AVG(leads_today), 2) as avg_leads_per_user,
    MIN(leads_today) as min_leads,
    MAX(leads_today) as max_leads
FROM users 
WHERE is_active = true
GROUP BY plan_name
ORDER BY avg_leads_per_user DESC;

-- Zero Lead Users (Who Still Waiting)
SELECT 
    COUNT(*) as zero_lead_count,
    STRING_AGG(name, ', ' ORDER BY plan_name) as waiting_users
FROM users 
WHERE is_active = true AND leads_today = 0;
