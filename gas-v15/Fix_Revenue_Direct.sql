-- ============================================================================
-- 🔧 FINAL DEBUG: CORRECT IST TIMEZONE LOGIC
-- ============================================================================

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
                
                -- FIXED: Single Timezone Conversion (UTC -> IST Wall Clock)
                'daily_active_users', COUNT(*) FILTER (WHERE (last_activity AT TIME ZONE 'Asia/Kolkata')::date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date),
                
                'online_now', COUNT(*) FILTER (WHERE last_activity > NOW() - INTERVAL '5 minutes'),
                
                'logins_today', COUNT(*) FILTER (WHERE (last_activity AT TIME ZONE 'Asia/Kolkata')::date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date),
                
                'starter_users', COUNT(*) FILTER (WHERE plan_name = 'starter'),
                'supervisor_users', COUNT(*) FILTER (WHERE plan_name = 'supervisor'),
                'manager_users', COUNT(*) FILTER (WHERE plan_name = 'manager'),
                'booster_users', COUNT(*) FILTER (WHERE plan_name IN ('weekly_boost', 'turbo_boost')),
                'mrr', 0,

                -- ✅ FIXED REVENUE LOGIC: Single conversion to IST
                'daily_revenue', (
                    SELECT COALESCE(SUM(amount), 0)
                    FROM payments 
                    WHERE status = 'captured' 
                    AND (created_at AT TIME ZONE 'Asia/Kolkata')::date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date
                )
            ) FROM users
        ),
        'leads_stats', (
            SELECT json_build_object(
                -- ✅ FIXED LEADS TODAY LOGIC
                'leads_today', COUNT(*) FILTER (WHERE (created_at AT TIME ZONE 'Asia/Kolkata')::date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date),
                'total_leads', COUNT(*)
            ) FROM leads
        ),
        'queue_stats', '{"queued_leads":0, "orphan_leads":0, "failed_distributions":0}'::json,
        'hourly_leads', '[]'::json,
        'hourly_logins', '[]'::json,
        'hourly_active', '[]'::json,
        'plan_analytics', '[]'::json,
        'user_activities', '[]'::json,
        'fetched_at', to_json(NOW())
    ) INTO result;
    
    RETURN result;
END;
$$;
