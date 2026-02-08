
-- ============================================================================
-- 💰 RESTORE PLANS BASED ON PAYMENT HISTORY (CHIRAG TEAM)
-- ============================================================================

DO $$
BEGIN

    -- 1. MANAGER PLAN (2999)
    UPDATE users u
    SET plan_name = 'manager', daily_limit = 176
    FROM payments p
    WHERE u.id = p.user_id
    AND u.team_code = 'GJ01TEAMFIRE'
    AND p.amount = 2999
    AND p.status = 'captured'
    AND p.created_at >= NOW() - INTERVAL '30 days';

    -- 2. TURBO BOOST (2499)
    UPDATE users u
    SET plan_name = 'turbo_boost', daily_limit = 108
    FROM payments p
    WHERE u.id = p.user_id
    AND u.team_code = 'GJ01TEAMFIRE'
    AND p.amount = 2499
    AND p.status = 'captured'
    AND p.created_at >= NOW() - INTERVAL '30 days';

    -- 3. SUPERVISOR / WEEKLY BOOST (1999)
    -- Assuming 1999 is Weekly/Supervisor. Setting to Weekly Boost (Safe bet) or Supervisor?
    -- Let's set to 'weekly_boost' as default for 1999.
    UPDATE users u
    SET plan_name = 'weekly_boost', daily_limit = 92
    FROM payments p
    WHERE u.id = p.user_id
    AND u.team_code = 'GJ01TEAMFIRE'
    AND p.amount = 1999
    AND p.status = 'captured'
    AND p.created_at >= NOW() - INTERVAL '30 days';

    -- 4. STARTER (999)
    UPDATE users u
    SET plan_name = 'starter', daily_limit = 55
    FROM payments p
    WHERE u.id = p.user_id
    AND u.team_code = 'GJ01TEAMFIRE'
    AND p.amount = 999
    AND p.status = 'captured'
    AND p.created_at >= NOW() - INTERVAL '30 days';

    RAISE NOTICE '✅ Plans Restored based on Payment Amount!';

END $$;
