-- ============================================================================
-- ADMIN DASHBOARD RPC FUNCTION
-- ============================================================================
-- Purpose: Single optimized query for all admin dashboard data
-- Returns: JSON with user stats, lead stats, queue stats, hourly data
-- ============================================================================

-- Drop existing function first (required for return type changes)
DROP FUNCTION IF EXISTS get_admin_dashboard_data();

CREATE OR REPLACE FUNCTION get_admin_dashboard_data()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'user_stats', (
            SELECT json_build_object(
                'total_users', COUNT(*),
                'active_users', COUNT(*) FILTER (WHERE payment_status = 'active'),
                'daily_active_users', COUNT(*) FILTER (WHERE last_activity::date = CURRENT_DATE),
                'monthly_active_users', COUNT(*) FILTER (WHERE last_activity > CURRENT_DATE - INTERVAL '30 days'),
                'online_now', COUNT(*) FILTER (WHERE last_activity > NOW() - INTERVAL '5 minutes'),
                'logins_today', SUM(COALESCE((SELECT COUNT(*) FROM auth.sessions WHERE user_id = users.id AND created_at::date = CURRENT_DATE), 0)),
                'starter_users', COUNT(*) FILTER (WHERE plan_name = 'starter'),
                'supervisor_users', COUNT(*) FILTER (WHERE plan_name = 'supervisor'),
                'manager_users', COUNT(*) FILTER (WHERE plan_name = 'manager'),
                'booster_users', COUNT(*) FILTER (WHERE plan_name IN ('weekly_boost', 'turbo_boost')),
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
                'daily_revenue', COALESCE(SUM(
                    CASE 
                        WHEN plan_name = 'starter' THEN 999
                        WHEN plan_name = 'supervisor' THEN 1999
                        WHEN plan_name = 'manager' THEN 2999
                        WHEN plan_name = 'weekly_boost' THEN 1999
                        WHEN plan_name = 'turbo_boost' THEN 2499
                        ELSE 0
                    END
                ) FILTER (WHERE payment_status = 'active' AND created_at::date = CURRENT_DATE), 0)
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
                'queued_leads', COUNT(*) FILTER (WHERE status = 'New' AND user_id IS NULL),
                'orphan_leads', (SELECT COUNT(*) FROM orphan_leads WHERE status = 'pending'),
                'failed_distributions', COUNT(*) FILTER (WHERE status = 'Failed')
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
        'hourly_logins', (
            SELECT COALESCE(json_agg(json_build_object('hour', hour, 'login_count', login_count) ORDER BY hour), '[]'::json)
            FROM (
                SELECT EXTRACT(HOUR FROM last_activity)::int AS hour, COUNT(DISTINCT id)::int AS login_count
                FROM users
                WHERE last_activity::date = CURRENT_DATE
                GROUP BY hour
            ) t
        ),
        'hourly_active', (
            SELECT COALESCE(json_agg(json_build_object('hour', hour, 'active_count', active_count) ORDER BY hour), '[]'::json)
            FROM (
                SELECT EXTRACT(HOUR FROM last_activity)::int AS hour, COUNT(DISTINCT id)::int AS active_count
                FROM users
                WHERE last_activity > NOW() - INTERVAL '24 hours'
                GROUP BY hour
            ) t
        ),
        'plan_analytics', (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'plan_name', plan_name,
                    'user_count', user_count,
                    'revenue', revenue,
                    'avg_leads_per_user', avg_leads_per_user,
                    'churn_rate', 0.0,
                    'satisfaction', 4.5
                ) ORDER BY user_count DESC
            ), '[]'::json)
            FROM (
                SELECT 
                    COALESCE(plan_name, 'none') AS plan_name,
                    COUNT(*)::int AS user_count,
                    SUM(
                        CASE 
                            WHEN plan_name = 'starter' THEN 999
                            WHEN plan_name = 'supervisor' THEN 1999
                            WHEN plan_name = 'manager' THEN 2999
                            WHEN plan_name = 'weekly_boost' THEN 1999
                            WHEN plan_name = 'turbo_boost' THEN 2499
                            ELSE 0
                        END
                    )::float AS revenue,
                    ROUND(AVG(COALESCE(leads_today, 0))::numeric, 1)::float AS avg_leads_per_user
                FROM users
                WHERE payment_status = 'active'
                GROUP BY plan_name
            ) t
        ),
        'user_activities', (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'user_id', id,
                    'name', name,
                    'email', email,
                    'plan', COALESCE(plan_name, 'none'),
                    'last_active', last_activity,
                    'is_online', (last_activity > NOW() - INTERVAL '5 minutes'),
                    'login_count', 1,
                    'leads_received', COALESCE(total_leads_received, 0),
                    'conversion_rate', 0.0,
                    'session_time', 0
                ) ORDER BY last_activity DESC NULLS LAST
            ) FILTER (WHERE payment_status = 'active'), '[]'::json)
            FROM users
            LIMIT 100
        ),
        'fetched_at', to_json(NOW())
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_admin_dashboard_data() TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_dashboard_data() TO service_role;

COMMENT ON FUNCTION get_admin_dashboard_data() IS 
'Returns comprehensive admin dashboard data in a single optimized query. Used by AdminDashboard.tsx';
