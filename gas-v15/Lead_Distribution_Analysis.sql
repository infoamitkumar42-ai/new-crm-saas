-- ============================================================================
-- LEAD DISTRIBUTION ANALYSIS QUERIES
-- Run Date: 2026-01-09 (Today)
-- Purpose: Analyze lead distribution patterns and user quotas
-- ============================================================================

-- ============================================================================
-- QUERY 1: Users who received leads after 12 PM today (with quota usage)
-- ============================================================================

SELECT 
    u.name AS "User Name",
    u.email AS "Email",
    u.plan_name AS "Plan",
    u.daily_limit AS "Daily Quota",
    u.leads_today AS "Leads Received Today",
    ROUND((u.leads_today::numeric / NULLIF(u.daily_limit, 0) * 100), 1) AS "Quota Used %",
    (u.daily_limit - COALESCE(u.leads_today, 0)) AS "Remaining Today",
    COUNT(l.id) AS "Leads After 12PM",
    MAX(l.assigned_at) AS "Last Lead Time"
FROM users u
LEFT JOIN leads l ON l.user_id = u.id 
    AND l.assigned_at::date = CURRENT_DATE 
    AND EXTRACT(HOUR FROM l.assigned_at) >= 12
WHERE u.payment_status = 'active'
GROUP BY u.id, u.name, u.email, u.plan_name, u.daily_limit, u.leads_today
HAVING COUNT(l.id) > 0
ORDER BY COUNT(l.id) DESC;

-- ============================================================================
-- QUERY 2: All active users with today's quota status
-- ============================================================================

SELECT 
    u.name AS "User Name",
    u.email AS "Email",
    u.plan_name AS "Plan",
    u.payment_status AS "Status",
    u.daily_limit AS "Daily Limit",
    COALESCE(u.leads_today, 0) AS "Received Today",
    (u.daily_limit - COALESCE(u.leads_today, 0)) AS "Remaining",
    ROUND((COALESCE(u.leads_today, 0)::numeric / NULLIF(u.daily_limit, 0) * 100), 1) AS "Usage %",
    u.is_active AS "Delivery Active",
    CASE 
        WHEN u.leads_today >= u.daily_limit THEN '🔴 Limit Reached'
        WHEN u.leads_today >= u.daily_limit * 0.8 THEN '🟡 Almost Full'
        WHEN u.leads_today > 0 THEN '🟢 Active'
        ELSE '⚪ No Leads Yet'
    END AS "Status Icon"
FROM users u
WHERE u.payment_status = 'active'
ORDER BY u.leads_today DESC, u.daily_limit DESC;

-- ============================================================================
-- QUERY 3: Users who got NO leads yesterday after 10 AM
-- ============================================================================

WITH yesterday_leads AS (
    SELECT 
        user_id,
        COUNT(*) AS leads_count
    FROM leads
    WHERE assigned_at::date = (CURRENT_DATE - INTERVAL '1 day')::date
      AND EXTRACT(HOUR FROM assigned_at) >= 10
    GROUP BY user_id
)
SELECT 
    u.name AS "User Name",
    u.email AS "Email",
    u.plan_name AS "Plan",
    u.daily_limit AS "Expected Leads/Day",
    u.is_active AS "Delivery Active",
    u.payment_status AS "Payment Status",
    COALESCE(yl.leads_count, 0) AS "Leads Yesterday (Post 10AM)",
    u.last_activity AS "Last Active",
    CASE 
        WHEN u.is_active = false THEN '⏸️ Paused by User'
        WHEN u.leads_today >= u.daily_limit THEN '✅ Limit Reached'
        ELSE '❌ Distribution Issue'
    END AS "Reason"
FROM users u
LEFT JOIN yesterday_leads yl ON yl.user_id = u.id
WHERE u.payment_status = 'active'
  AND COALESCE(yl.leads_count, 0) = 0
ORDER BY u.daily_limit DESC, u.name;

-- ============================================================================
-- QUERY 4: Hourly distribution summary for today
-- ============================================================================

SELECT 
    EXTRACT(HOUR FROM l.assigned_at) AS "Hour",
    COUNT(*) AS "Leads Distributed",
    COUNT(DISTINCT l.user_id) AS "Unique Users",
    ROUND(AVG(l.distribution_score), 2) AS "Avg Score",
    STRING_AGG(DISTINCT u.plan_name, ', ') AS "Plans"
FROM leads l
JOIN users u ON u.id = l.user_id
WHERE l.assigned_at::date = CURRENT_DATE
GROUP BY EXTRACT(HOUR FROM l.assigned_at)
ORDER BY "Hour";

-- ============================================================================
-- QUERY 5: Top performers (users who are actively calling)
-- ============================================================================

SELECT 
    u.name AS "User Name",
    u.plan_name AS "Plan",
    u.leads_today AS "Leads Today",
    COUNT(l.id) FILTER (WHERE l.status IN ('Contacted', 'Interested', 'Follow-up', 'Closed')) AS "Worked On",
    COUNT(l.id) FILTER (WHERE l.status = 'Closed') AS "Closed",
    COUNT(l.id) FILTER (WHERE l.status = 'Fresh') AS "Not Called Yet",
    ROUND(
        (COUNT(l.id) FILTER (WHERE l.status IN ('Contacted', 'Interested', 'Follow-up', 'Closed'))::numeric 
        / NULLIF(u.leads_today, 0) * 100), 1
    ) AS "Call Rate %"
FROM users u
LEFT JOIN leads l ON l.user_id = u.id AND l.created_at::date = CURRENT_DATE
WHERE u.payment_status = 'active' AND u.leads_today > 0
GROUP BY u.id, u.name, u.plan_name, u.leads_today
ORDER BY "Call Rate %" DESC NULLS LAST;

-- ============================================================================
-- QUERY 6: System health check
-- ============================================================================

SELECT 
    'Total Active Users' AS "Metric",
    COUNT(*) AS "Count"
FROM users WHERE payment_status = 'active'
UNION ALL
SELECT 
    'Users with Leads Today',
    COUNT(DISTINCT user_id)
FROM leads WHERE created_at::date = CURRENT_DATE
UNION ALL
SELECT 
    'Orphan Leads (Unassigned)',
    COUNT(*)
FROM orphan_leads WHERE status = 'pending'
UNION ALL
SELECT 
    'Paused Users (Active Plan)',
    COUNT(*)
FROM users WHERE payment_status = 'active' AND is_active = false
UNION ALL
SELECT 
    'Users at Quota Limit',
    COUNT(*)
FROM users WHERE payment_status = 'active' AND leads_today >= daily_limit;

-- ============================================================================
-- QUICK SUMMARY (Run this for instant overview)
-- ============================================================================

SELECT 
    COUNT(*) FILTER (WHERE leads_today > 0) AS "Users Got Leads Today",
    COUNT(*) FILTER (WHERE leads_today = 0) AS "Users NO Leads Today",
    COUNT(*) FILTER (WHERE leads_today >= daily_limit) AS "Quota Full",
    COUNT(*) FILTER (WHERE is_active = false) AS "Delivery Paused",
    SUM(leads_today) AS "Total Leads Distributed",
    ROUND(AVG(leads_today), 1) AS "Avg per User"
FROM users
WHERE payment_status = 'active';
