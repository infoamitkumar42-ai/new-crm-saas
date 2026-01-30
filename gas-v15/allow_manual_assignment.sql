-- 🔓 ALLOW MANUAL ASSIGNMENT (Bypass Limit)
-- This update modifies the trigger function to IGNORE 'Manual Import' leads.
-- This means you can assign UNLIMITED leads manually, and the limit only applies to Auto-Assign.

CREATE OR REPLACE FUNCTION check_lead_limit_before_insert()
RETURNS TRIGGER AS $$
DECLARE
    current_leads INT;
    max_limit INT;
    user_name TEXT;
BEGIN
    -- ✅ BYPASS LIMIT FOR MANUAL IMPORT
    IF NEW.source = 'Manual Import' THEN
        RETURN NEW;
    END IF;

    -- Only check if lead is being 'Assigned' immediately (not 'New')
    IF NEW.status = 'Assigned' AND NEW.assigned_to IS NOT NULL THEN
        
        -- Get User Stats
        -- Note: We assume leads_today is accurate. 
        -- To be safer, we could COUNT(*) here, but that is slower.
        SELECT leads_today, daily_limit, name 
        INTO current_leads, max_limit, user_name
        FROM users 
        WHERE id = NEW.assigned_to;
        
        -- Default to 0
        current_leads := COALESCE(current_leads, 0);
        max_limit := COALESCE(max_limit, 0);

        -- 🛑 THE HARD STOP
        IF current_leads >= max_limit THEN
            RAISE EXCEPTION '⛔ BLOCKED: User % is Full (%/%). Cannot assign lead.', user_name, current_leads, max_limit;
        END IF;
        
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
