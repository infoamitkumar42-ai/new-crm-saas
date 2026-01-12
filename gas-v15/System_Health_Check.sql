-- ============================================================================
-- SYSTEM HEALTH & DISTRIBUTION CHECK (TODAY: 2026-01-09)
-- ============================================================================

-- 1. Summary Overview
SELECT 
    (SELECT COUNT(*) FROM users WHERE is_active = true AND payment_status = 'active') as active_paying_users,
    (SELECT COUNT(*) FROM leads WHERE assigned_at >= CURRENT_DATE) as total_leads_assigned_today,
    (SELECT COUNT(*) FROM leads WHERE user_id IS NULL AND status = 'New') as total_pending_backlog;

-- 2. Detailed Per-User Distribution (Who received what today)
SELECT 
    u.name,
    u.email,
    u.daily_limit,
    u.leads_today as stats_counter,
    COUNT(l.id) as leads_in_dashboard_today,
    u.daily_limit - COUNT(l.id) as remaining_quota
FROM users u
LEFT JOIN leads l ON l.user_id = u.id AND l.assigned_at >= CURRENT_DATE
WHERE u.is_active = true 
  AND u.payment_status = 'active'
  AND u.role = 'member'
GROUP BY u.id, u.name, u.email, u.daily_limit, u.leads_today
ORDER BY leads_in_dashboard_today DESC;

-- 3. Check for any "Stuck" leads (Assigned but not recently)
SELECT COUNT(*) as stuck_leads
FROM leads 
WHERE status = 'Assigned' 
  AND user_id IS NOT NULL 
  AND assigned_at < NOW() - INTERVAL '1 day';
