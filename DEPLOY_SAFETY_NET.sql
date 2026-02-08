
-- ============================================================================
-- 🛡️ SAFETY NET TRIGGER: AUTO-DISTRIBUTE STUCK LEADS
-- ============================================================================

-- 1. Create Function to Distribute Stuck Leads
CREATE OR REPLACE FUNCTION process_stuck_lead()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_target_team TEXT;
    v_target_user UUID;
BEGIN
    -- Only process if Status is 'New' (Stuck)
    IF NEW.status = 'New' AND NEW.assigned_to IS NULL THEN
        
        -- A. DETERMINE TARGET TEAM BASED ON SOURCE
        IF NEW.source ILIKE '%chirag%' OR NEW.source ILIKE '%bhumit%' OR NEW.source ILIKE '%manual%' THEN
            v_target_team := 'GJ01TEAMFIRE';
        ELSIF NEW.source ILIKE '%rajwinder%' OR NEW.source ILIKE '%raj%' THEN
            v_target_team := 'TEAMRAJ';
        ELSIF NEW.source ILIKE '%cbo%' OR NEW.source ILIKE '%himanshu%' OR NEW.source ILIKE '%fire%' THEN
            v_target_team := 'TEAMFIRE';
        ELSE
            -- Unknown source, do not touch.
            RETURN NEW;
        END IF;

        -- B. FIND ELIGIBLE USER (Round Robin / Lowest Leads)
        -- We pick an active user who has not reached daily limit
        SELECT id INTO v_target_user
        FROM users
        WHERE team_code = v_target_team
        AND is_active = true
        AND leads_today < daily_limit
        ORDER BY leads_today ASC, random() -- Start with lowest leads, then random
        LIMIT 1;

        -- C. ASSIGN LEAD
        IF v_target_user IS NOT NULL THEN
            NEW.assigned_to := v_target_user;
            NEW.status := 'Assigned';
            
            -- Update User Counter
            UPDATE users SET leads_today = leads_today + 1 WHERE id = v_target_user;
        END IF;

    END IF;

    RETURN NEW;
END;
$$;

-- 2. Create Trigger (Before Insert)
DROP TRIGGER IF EXISTS trg_safety_net_assign ON leads;

CREATE TRIGGER trg_safety_net_assign
BEFORE INSERT ON leads
FOR EACH ROW
EXECUTE FUNCTION process_stuck_lead();

RAISE NOTICE '✅ Safety Net Trigger Deployed!';
