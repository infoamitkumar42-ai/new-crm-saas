-- ============================================================================
-- 📊 OVERALL LEAD DISTRIBUTION AUDIT (Today IST)
-- ============================================================================

-- Summary by Lead Count
SELECT 
    leads_today as lead_count,
    COUNT(*) as user_count,
    STRING_AGG(name, ', ' ORDER BY name) as users
FROM users 
WHERE is_active = true
GROUP BY leads_today
ORDER BY leads_today DESC;

-- Detailed List of Active Users
SELECT 
    name, 
    plan_name, 
    leads_today,
    email
FROM users 
WHERE is_active = true
ORDER BY plan_name, leads_today DESC;
