
-- ============================================================================
-- 🔔 UNIVERSAL NOTIFICATION TRIGGER
-- Sends notification whenever a lead is assigned (Insert or Update)
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_on_lead_assign()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if Assigned To Changed (from Null to Something, or Changed User)
    IF (TG_OP = 'INSERT' AND NEW.assigned_to IS NOT NULL) OR 
       (TG_OP = 'UPDATE' AND NEW.assigned_to IS NOT NULL AND (OLD.assigned_to IS NULL OR OLD.assigned_to <> NEW.assigned_to)) THEN
        
        -- Insert Notification
        INSERT INTO notifications (user_id, title, message, type, created_at)
        VALUES (
            NEW.assigned_to, 
            'New Lead Assigned! 🚀', 
            'You have a new lead: ' || COALESCE(NEW.name, 'Client') || '. Call now!', 
            'lead_assigned', 
            NOW()
        );
        
    END IF;
    RETURN NEW;
END;
$$;

-- Attach Trigger to LEADS table
DROP TRIGGER IF EXISTS trg_notify_assignment ON leads;

CREATE TRIGGER trg_notify_assignment
AFTER INSERT OR UPDATE OF assigned_to ON leads
FOR EACH ROW
EXECUTE FUNCTION notify_on_lead_assign();

-- ============================================================================
-- 🔄 REVERT SAFETY NET NOTIFICATION (To Avoid Double Notification)
-- ============================================================================
CREATE OR REPLACE FUNCTION process_stuck_lead()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_target_team TEXT;
    v_target_user UUID;
BEGIN
    IF NEW.status = 'New' AND NEW.assigned_to IS NULL THEN
        -- Logic same as before...
        IF NEW.source ILIKE '%chirag%' OR NEW.source ILIKE '%bhumit%' OR NEW.source ILIKE '%manual%' THEN
            v_target_team := 'GJ01TEAMFIRE';
        ELSIF NEW.source ILIKE '%rajwinder%' OR NEW.source ILIKE '%raj%' THEN
            v_target_team := 'TEAMRAJ';
        ELSIF NEW.source ILIKE '%cbo%' OR NEW.source ILIKE '%himanshu%' OR NEW.source ILIKE '%fire%' THEN
            v_target_team := 'TEAMFIRE';
        ELSE
            RETURN NEW; 
        END IF;

        SELECT id INTO v_target_user FROM users 
        WHERE team_code = v_target_team AND is_active = true AND leads_today < daily_limit
        ORDER BY leads_today ASC, random() LIMIT 1;

        IF v_target_user IS NOT NULL THEN
            NEW.assigned_to := v_target_user;
            NEW.status := 'Assigned';
            UPDATE users SET leads_today = leads_today + 1 WHERE id = v_target_user;
            -- Removed Explicit INSERT INTO notifications (Relies on Universal Trigger now)
        END IF;
    END IF;
    RETURN NEW;
END;
$$;
