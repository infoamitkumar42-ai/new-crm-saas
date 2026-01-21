
-- 🚨 REMOVE THE STOP TRIGGER TO RESUME OPERATIONS
DROP TRIGGER IF EXISTS stop_leads_trigger ON leads;
DROP FUNCTION IF EXISTS force_stop_assignments;

-- Verify
SELECT 'Trigger Removed. Assignments Allowed.' as status;
