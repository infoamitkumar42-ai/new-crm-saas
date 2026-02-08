
-- ============================================================================
-- 🕵️‍♂️ MANUAL VERIFICATION SCRIPT (Run to Check System Status)
-- ============================================================================
-- Is script se aap khud verify kar sakte hain ki:
-- 1. Chirag ki team (GJ01TEAMFIRE) ke paas 0 leads hain.
-- 2. Himanshu (TEAMFIRE) aur Rajwinder (TEAMRAJ) ke paas leads hain.
-- 3. Koi bhi lead 'New' status mein stuck nahi hai.
-- ============================================================================

DO $$
DECLARE
    v_chirag_leads INT;
    v_himanshu_leads INT;
    v_rajwinder_leads INT;
    v_stuck_leads INT;
BEGIN
    -- 1. CHECK CHIRAG TEAM LEADS (Should be 0)
    SELECT COUNT(*) INTO v_chirag_leads
    FROM leads l
    JOIN users u ON l.assigned_to = u.id
    WHERE u.team_code = 'GJ01TEAMFIRE'
    AND l.created_at >= CURRENT_DATE;

    -- 2. CHECK HIMANSHU TEAM LEADS
    SELECT COUNT(*) INTO v_himanshu_leads
    FROM leads l
    JOIN users u ON l.assigned_to = u.id
    WHERE u.team_code = 'TEAMFIRE'
    AND l.created_at >= CURRENT_DATE;

    -- 3. CHECK RAJWINDER TEAM LEADS
    SELECT COUNT(*) INTO v_rajwinder_leads
    FROM leads l
    JOIN users u ON l.assigned_to = u.id
    WHERE u.team_code = 'TEAMRAJ'
    AND l.created_at >= CURRENT_DATE;

    -- 4. CHECK STUCK LEADS (Should be 0)
    SELECT COUNT(*) INTO v_stuck_leads
    FROM leads
    WHERE status = 'New' 
    AND created_at >= CURRENT_DATE;

    -- 5. PRINT REPORT
    RAISE NOTICE '------------------------------------------------';
    RAISE NOTICE '📊 LIVE SYSTEM REPORT (Latest)';
    RAISE NOTICE '------------------------------------------------';
    RAISE NOTICE '🚫 Chirag Team Leads (Should be 0): %', v_chirag_leads;
    RAISE NOTICE '🔥 Himanshu Team Leads: %', v_himanshu_leads;
    RAISE NOTICE '👑 Rajwinder Team Leads: %', v_rajwinder_leads;
    RAISE NOTICE '⚠️ Stuck/New Leads (Should be 0): %', v_stuck_leads;
    RAISE NOTICE '------------------------------------------------';

    IF v_chirag_leads = 0 THEN
        RAISE NOTICE '✅ VERIFIED: Chirag Team is clean.';
    ELSE
        RAISE WARNING '❌ WARNING: Chirag Team still has leads!';
    END IF;

END $$;
