CREATE OR REPLACE FUNCTION public.get_best_assignee_for_team(
    p_team_code TEXT
)
RETURNS TABLE (
    user_id UUID,
    user_name TEXT,
    user_email TEXT,
    plan_name TEXT,
    daily_limit INT,
    leads_today BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH today_counts AS (
        SELECT 
            u.id,
            u.name,
            u.email,
            u.plan_name,
            COALESCE(u.daily_limit_override, u.daily_limit, 0) AS daily_limit,
            COALESCE(
                (SELECT COUNT(*) 
                 FROM leads l 
                 WHERE (l.assigned_to = u.id OR l.user_id = u.id)
                 AND l.created_at >= CURRENT_DATE::timestamp),
                0
            ) AS leads_today
        FROM users u
        WHERE u.team_code = p_team_code
          AND u.is_active = true
          AND u.is_online = true
          AND u.role IN ('member', 'manager')
          AND (u.total_leads_promised IS NULL OR u.total_leads_promised = 0 OR u.total_leads_received < u.total_leads_promised)
    ),
    eligible_users AS (
        SELECT *
        FROM today_counts
        WHERE leads_today < daily_limit
    )
    SELECT 
        eu.id AS user_id,
        eu.name AS user_name,
        eu.email AS user_email,
        eu.plan_name,
        eu.daily_limit::INT,
        eu.leads_today
    FROM eligible_users eu
    ORDER BY
        (CASE WHEN eu.leads_today % 2 = 1 THEN 0 ELSE 1 END) ASC,
        (CASE 
            WHEN LOWER(eu.plan_name) LIKE '%turbo%' OR LOWER(eu.plan_name) LIKE '%boost%' THEN 4
            WHEN LOWER(eu.plan_name) LIKE '%manager%' THEN 3
            WHEN LOWER(eu.plan_name) LIKE '%supervisor%' THEN 2
            ELSE 1
        END) DESC,
        eu.leads_today ASC
    LIMIT 1;
END;
$$;
