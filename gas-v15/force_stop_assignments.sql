
-- 🚨 NUCLEAR OPTION: FORCE STOP ALL ASSIGNMENTS
-- This trigger will INTERCEPT any lead assignment and force it to be 'New' (Unassigned).
-- It overrides whatever the Webhook or Cron tries to do.

CREATE OR REPLACE FUNCTION force_stop_assignments()
RETURNS TRIGGER AS $$
BEGIN
    -- If something tries to Assign a lead, FORCE it to be New/Null
    IF NEW.status = 'Assigned' OR NEW.user_id IS NOT NULL THEN
        NEW.status := 'New';
        NEW.user_id := NULL;
        NEW.assigned_to := NULL;
        NEW.assigned_at := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply Trigger to LEADS table (Before Insert/Update)
DROP TRIGGER IF EXISTS stop_leads_trigger ON leads;
CREATE TRIGGER stop_leads_trigger
BEFORE INSERT OR UPDATE ON leads
FOR EACH ROW
EXECUTE FUNCTION force_stop_assignments();

-- Confirm
SELECT 'Assignments Forced Stopped' as status;
