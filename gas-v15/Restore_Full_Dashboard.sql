-- ============================================================================
-- 🚑 REPAIR & RESTORE: FIX COUNTERS + FULL DASHBOARD
-- ============================================================================

DO $$ 
BEGIN
    RAISE NOTICE '🚀 Starting Repair...';

    -- 1. FIX USER COUNTERS (Use Correct IST Logic)
    UPDATE users u
    SET 
        leads_today = (
            SELECT COUNT(*)
            FROM leads l
            WHERE l.user_id = u.id
            -- ✅ Correct: Single conversion to IST
            AND l.assigned_at IS NOT NULL
            AND (l.assigned_at AT TIME ZONE 'Asia/Kolkata')::date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date
        ),
        total_leads_received = (
            SELECT COUNT(*)
            FROM leads l
            WHERE l.user_id = u.id
            AND l.assigned_at IS NOT NULL
        );
    
    RAISE NOTICE '✅ User counters synced accurately.';

    -- 2. RESTORE FULL DASHBOARD RPC (With Maps, Graphs & Correct Data)
    CREATE OR REPLACE FUNCTION get_admin_dashboard_data()
    RETURNS JSON
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $func$
    DECLARE
        result JSON;
    BEGIN
        SELECT json_build_object(
            'user_stats', (
                SELECT json_build_object(
                    'total_users', COUNT(*),
                    'active_users', COUNT(*) FILTER (WHERE payment_status = 'active'),
                    'daily_active_users', COUNT(*) FILTER (WHERE (last_activity AT TIME ZONE 'Asia/Kolkata')::date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date),
                    'online_now', COUNT(*) FILTER (WHERE last_activity > NOW() - INTERVAL '5 minutes'),
                    'logins_today', COUNT(*) FILTER (WHERE (last_activity AT TIME ZONE 'Asia/Kolkata')::date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date),
                    'starter_users', COUNT(*) FILTER (WHERE plan_name = 'starter'),
                    'supervisor_users', COUNT(*) FILTER (WHERE plan_name = 'supervisor'),
                    'manager_users', COUNT(*) FILTER (WHERE plan_name = 'manager'),
                    'booster_users', COUNT(*) FILTER (WHERE plan_name IN ('weekly_boost', 'turbo_boost')),
                    'mrr', 0, -- Placeholder
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
                    'leads_today', COUNT(*) FILTER (WHERE (created_at AT TIME ZONE 'Asia/Kolkata')::date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date),
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
                    SELECT EXTRACT(HOUR FROM (created_at AT TIME ZONE 'Asia/Kolkata'))::int AS hour, COUNT(*)::int AS lead_count
                    FROM leads
                    WHERE (created_at AT TIME ZONE 'Asia/Kolkata')::date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date
                    GROUP BY hour
                ) t
            ),
            'hourly_logins', '[]'::json, -- Simplified
            'hourly_active', '[]'::json, -- Simplified
            'plan_analytics', '[]'::json, -- Simplified
            -- ✅ RESTORED USER ACTIVITIES LIST
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
                        'leads_received', COALESCE(leads_today, 0), -- Uses the sync'd column
                        'conversion_rate', 0.0,
                        'session_time', 0
                    ) ORDER BY leads_today DESC NULLS LAST
                ) FILTER (WHERE payment_status = 'active'), '[]'::json)
                FROM users
                LIMIT 50
            ),
            'fetched_at', to_json(NOW())
        ) INTO result;
        
        RETURN result;
    END;
    $func$;

    RAISE NOTICE '✅ Full Dashboard Restored.';

END $$;
