
-- 🛡️ ULTIMATE HARD STOP TRIGGER
-- This trigger runs BEFORE any lead is inserted into the 'leads' table.
-- It checks if the assigned user has reached their daily limit.
-- If they have, it REJECTS the insert with an error.

CREATE OR REPLACE FUNCTION check_lead_limit_before_insert()
RETURNS TRIGGER AS $$
DECLARE
    current_leads INT;
    max_limit INT;
    user_name TEXT;
BEGIN
    -- Only check if lead is being 'Assigned' immediately (not 'New')
    -- If status is 'New', it's unassigned, so allow it.
    IF NEW.status = 'Assigned' AND NEW.assigned_to IS NOT NULL THEN
        
        -- Get User Stats
        SELECT leads_today, daily_limit, name 
        INTO current_leads, max_limit, user_name
        FROM users 
        WHERE id = NEW.assigned_to;
        
        -- Default to 0 if null
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

-- Drop trigger if exists to allow clean recreate
DROP TRIGGER IF EXISTS trg_check_limit_insert ON leads;

-- Create the Trigger
CREATE TRIGGER trg_check_limit_insert
BEFORE INSERT ON leads
FOR EACH ROW
EXECUTE FUNCTION check_lead_limit_before_insert();

-- Also protect UPDATES (e.g. Status change New -> Assigned)
DROP TRIGGER IF EXISTS trg_check_limit_update ON leads;

CREATE TRIGGER trg_check_limit_update
BEFORE UPDATE ON leads
FOR EACH ROW
EXECUTE FUNCTION check_lead_limit_before_insert();
