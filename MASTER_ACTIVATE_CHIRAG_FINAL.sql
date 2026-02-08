
-- ============================================================================
-- 🧹 MASTER CLEANUP & ACTIVATION: CHIRAG TEAM (GJ01TEAMFIRE)
-- ============================================================================

DO $$
BEGIN

    -- 1. 🛑 DEACTIVATE UNPAID USERS
    -- Logic: Disable everyone in team first, then Re-enable valid ones.
    -- This is safer to ensure no "Free Loaders" slip through.
    
    UPDATE users 
    SET 
        is_active = false,
        daily_limit = 0,
        plan_name = 'none'
    WHERE team_code = 'GJ01TEAMFIRE';

    -- 2. 🟢 RE-ACTIVATE EXISTING PAYERS (The 18 Verified Valid Users)
    -- We use their emails to targetedly activate them.
    UPDATE users 
    SET 
        is_active = true,
        plan_name = CASE 
            WHEN plan_name = 'none' THEN 'starter' -- Default fallback
            ELSE plan_name 
        END,
        -- Restore Limits based on Plan
        daily_limit = CASE 
            WHEN plan_name = 'starter' THEN 55
            WHEN plan_name = 'supervisor' THEN 115
            WHEN plan_name = 'manager' THEN 176
            WHEN plan_name = 'weekly_boost' THEN 92
            WHEN plan_name = 'turbo_boost' THEN 108
            ELSE 55
        END
    WHERE team_code = 'GJ01TEAMFIRE'
    AND email IN (
        'vaishaliadesra78@gmail.com', 'payal_dadhaniya@yahoo.com', 'akshaykapadiya33@gmail.com', 
        'vanshbanker1@gmail.com', 'shrutipatel8914@gmail.com', 'shekhbharatbhai162@gmail.com',
        'ajayahir0064@gmail.com', 'nodhichetanchoksi@gmail.com', 'yeshdabhi9@gmail.com',
        'jogadiyaashwin61@gmail.com', 'sumitakapadiya384@gmail.com', 'happysathvara27@gmail.com',
        'kamo73518@gmail.com', 'ramiparth62@gmail.com', 'sameerchauhan010424@gmail.com',
        'kargarbrijesh99@gmail.com', 'namratadarjiforever@gmail.com', 'sumitbambhaniya024@gmail.com',
        'fatimajodhatarfatimajodhatar@gmail.com'
    );

    -- 3. 👑 ACTIVATE ADMIN
    UPDATE users SET is_active = true, daily_limit = 100 WHERE email = 'chirag01@gmail.com';

    -- 4. 🚀 MANUAL ACTIVATION (Your 3 Users - Turbo Boost Weekly)
    -- Kaushal Rathod, Chirag Darji, Bhumit Patel
    UPDATE users 
    SET 
        is_active = true,
        is_online = true,
        payment_status = 'active',
        plan_name = 'turbo_boost', 
        daily_limit = 108, -- Turbo Limit
        valid_until = NOW() + INTERVAL '7 days', -- Weekly Plan
        updated_at = NOW()
    WHERE email IN (
        'kaushalrathod2113@gmail.com', 
        'cmdarji2000@gmail.com', 
        'bhumitpatel.0764@gmail.com'
    );

    RAISE NOTICE '✅ Chirag Team Cleaned & Activated!';

END $$;
