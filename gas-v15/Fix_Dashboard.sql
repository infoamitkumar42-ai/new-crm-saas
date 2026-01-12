-- ============================================================================
-- FIXED ADMIN DASHBOARD RPC (v3.0 - REVENUE FIX)
-- ============================================================================

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
                'daily_active_users', COUNT(*) FILTER (WHERE last_activity::date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date),
                'online_now', COUNT(*) FILTER (WHERE last_activity > NOW() - INTERVAL '5 minutes'),
                
                -- FIXED: Count Logins Correctly
                'logins_today', COUNT(*) FILTER (WHERE last_activity > (NOW() AT TIME ZONE 'Asia/Kolkata')::date),
                
                'starter_users', COUNT(*) FILTER (WHERE plan_name = 'starter'),
                'supervisor_users', COUNT(*) FILTER (WHERE plan_name = 'supervisor'),
                'manager_users', COUNT(*) FILTER (WHERE plan_name = 'manager'),
                'booster_users', COUNT(*) FILTER (WHERE plan_name IN ('weekly_boost', 'turbo_boost')),
                
                -- MRR (Monthly Recurring Revenue) estimation
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

                -- ✅ FIXED: DAILY REVENUE FROM PAYMENTS TABLE (IST)
                'daily_revenue', (
                    SELECT COALESCE(SUM(amount), 0)
                    FROM payments 
                    WHERE status = 'captured' 
                    AND (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date
                )
            ) FROM users
        ),
        'leads_stats', (
            SELECT json_build_object(
                'leads_today', COUNT(*) FILTER (WHERE (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date),
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
                SELECT EXTRACT(HOUR FROM (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'))::int AS hour, COUNT(*)::int AS lead_count
                FROM leads
                WHERE (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date
                GROUP BY hour
            ) t
        ),
        -- Add other fields as empty arrays to prevent frontend errors
        'hourly_logins', '[]'::json,
        'hourly_active', '[]'::json,
        'plan_analytics', '[]'::json,
        'user_activities', '[]'::json,
        'fetched_at', to_json(NOW())
    ) INTO result;
    
    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_admin_dashboard_data() TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_dashboard_data() TO service_role;
