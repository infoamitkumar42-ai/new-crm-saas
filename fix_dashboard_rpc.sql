-- ============================================================================
-- FIXED ADMIN DASHBOARD RPC FUNCTION v2
-- ============================================================================
-- Fixes:
-- 1. online_now uses is_online column (not last_activity)
-- 2. daily_revenue reads from payments table
-- ============================================================================

DROP FUNCTION IF EXISTS get_admin_dashboard_data();

CREATE OR REPLACE FUNCTION get_admin_dashboard_data()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    today_revenue NUMERIC;
BEGIN
    -- Get today's revenue from payments table
    SELECT COALESCE(SUM(amount), 0) INTO today_revenue
    FROM payments
    WHERE status = 'captured' AND created_at::date = CURRENT_DATE;

    SELECT json_build_object(
        'user_stats', (
            SELECT json_build_object(
                'total_users', COUNT(*),
                'active_users', COUNT(*) FILTER (WHERE payment_status = 'active'),
                'daily_active_users', COUNT(*) FILTER (WHERE leads_today > 0 OR last_activity::date = CURRENT_DATE),
                'monthly_active_users', COUNT(*) FILTER (WHERE last_activity > CURRENT_DATE - INTERVAL '30 days'),
                'online_now', COUNT(*) FILTER (WHERE is_online = true AND is_active = true), -- FIXED: Use is_online column!
                'logins_today', 0,
                'starter_users', COUNT(*) FILTER (WHERE plan_name = 'starter' AND payment_status = 'active'),
                'supervisor_users', COUNT(*) FILTER (WHERE plan_name = 'supervisor' AND payment_status = 'active'),
                'manager_users', COUNT(*) FILTER (WHERE plan_name = 'manager' AND payment_status = 'active'),
                'booster_users', COUNT(*) FILTER (WHERE plan_name IN ('weekly_boost', 'turbo_boost') AND payment_status = 'active'),
                'mrr', COALESCE(SUM(
                    CASE 
                        WHEN plan_name = 'starter' THEN 999
                        WHEN plan_name = 'supervisor' THEN 1999
                        WHEN plan_name = 'manager' THEN 2999
                        WHEN plan_name = 'weekly_boost' THEN 1999
                        WHEN plan_name = 'turbo_boost' THEN 2499
                        ELSE 0
                    END
                ) FILTER (WHERE payment_status = 'active'), 0),
                'daily_revenue', today_revenue -- FIXED: From payments table!
            ) FROM users
        ),
        'leads_stats', (
            SELECT json_build_object(
                'leads_today', COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE),
                'leads_this_week', COUNT(*) FILTER (WHERE created_at > CURRENT_DATE - INTERVAL '7 days'),
                'leads_this_month', COUNT(*) FILTER (WHERE created_at > CURRENT_DATE - INTERVAL '30 days'),
                'total_leads', COUNT(*)
            ) FROM leads
        ),
        'queue_stats', (
            SELECT json_build_object(
                'queued_leads', COUNT(*) FILTER (WHERE status IN ('New', 'Fresh') AND user_id IS NULL),
                'orphan_leads', (SELECT COUNT(*) FROM leads WHERE status IN ('New', 'Fresh') AND user_id IS NULL),
                'failed_distributions', 0
            ) FROM leads
        ),
        'hourly_leads', (
            SELECT COALESCE(json_agg(json_build_object('hour', hour, 'lead_count', lead_count) ORDER BY hour), '[]'::json)
            FROM (
                SELECT EXTRACT(HOUR FROM created_at)::int AS hour, COUNT(*)::int AS lead_count
                FROM leads
                WHERE created_at::date = CURRENT_DATE
                GROUP BY hour
            ) t
        ),
        'hourly_logins', '[]'::json,
        'hourly_active', '[]'::json,
        'plan_analytics', '[]'::json,
        'user_activities', (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'user_id', id,
                    'name', name,
                    'email', email,
                    'plan', COALESCE(plan_name, 'none'),
                    'last_active', last_activity,
                    'is_online', is_online, -- FIXED: Use actual column
                    'login_count', leads_today,
                    'leads_received', COALESCE(leads_today, 0),
                    'conversion_rate', 0.0,
                    'session_time', 0
                ) ORDER BY is_online DESC, leads_today ASC
            ) FILTER (WHERE payment_status = 'active'), '[]'::json)
            FROM users
        ),
        'fetched_at', to_json(NOW())
    ) INTO result;
    
    RETURN result;
END;
$$;
