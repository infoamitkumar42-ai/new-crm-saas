
-- ============================================================================
-- 🛠️ MASTER FIX: ACTIVATE ALL PAYING USERS (CHIRAG TEAM)
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '🚀 Starting Activation for Paying Users with Missing Plans...';

    -- 1. RESTORE MANAGER (2999)
    UPDATE users u
    SET plan_name = 'manager', daily_limit = 176, is_active = true, is_online = true, valid_until = NOW() + INTERVAL '30 days'
    FROM payments p
    WHERE u.id = p.user_id
    AND u.team_code = 'GJ01TEAMFIRE'
    AND (u.plan_name IS NULL OR u.plan_name = 'none' OR u.is_active = false)
    AND p.amount = 2999
    AND p.status = 'captured';

    -- 2. RESTORE TURBO (2499)
    UPDATE users u
    SET plan_name = 'turbo_boost', daily_limit = 108, is_active = true, is_online = true, valid_until = NOW() + INTERVAL '30 days'
    FROM payments p
    WHERE u.id = p.user_id
    AND u.team_code = 'GJ01TEAMFIRE'
    AND (u.plan_name IS NULL OR u.plan_name = 'none' OR u.is_active = false)
    AND p.amount = 2499
    AND p.status = 'captured';

    -- 3. RESTORE WEEKLY/SUPERVISOR (1999)
    UPDATE users u
    SET plan_name = 'weekly_boost', daily_limit = 92, is_active = true, is_online = true, valid_until = NOW() + INTERVAL '30 days'
    FROM payments p
    WHERE u.id = p.user_id
    AND u.team_code = 'GJ01TEAMFIRE'
    AND (u.plan_name IS NULL OR u.plan_name = 'none' OR u.is_active = false)
    AND p.amount = 1999
    AND p.status = 'captured';

    -- 4. RESTORE STARTER (999)
    UPDATE users u
    SET plan_name = 'starter', daily_limit = 55, is_active = true, is_online = true, valid_until = NOW() + INTERVAL '30 days'
    FROM payments p
    WHERE u.id = p.user_id
    AND u.team_code = 'GJ01TEAMFIRE'
    AND (u.plan_name IS NULL OR u.plan_name = 'none' OR u.is_active = false)
    AND p.amount = 999
    AND p.status = 'captured';
    
    -- 5. SPECIAL FIX FOR CHIRAG (LOGIN EMAIL)
    UPDATE users 
    SET plan_name = 'turbo_boost', daily_limit = 14, is_active = true, is_online = true, valid_until = NOW() + INTERVAL '30 days'
    WHERE email = 'cmdarji1997@gmail.com';  -- The one logged in dashboard

    RAISE NOTICE '✅ All paying users restored and activated!';
END $$;
