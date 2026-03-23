-- ==============================================================================
-- SQL Script: Auto-Update Total Leads Received & Quota Check Trigger
-- ==============================================================================

-- 1. Create the trigger function
CREATE OR REPLACE FUNCTION update_user_lead_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if a lead was assigned to a user (INSERT with assigned_to OR UPDATE where assigned_to changed to NOT NULL)
    IF (TG_OP = 'INSERT' AND NEW.assigned_to IS NOT NULL) OR 
       (TG_OP = 'UPDATE' AND NEW.assigned_to IS NOT NULL AND OLD.assigned_to IS DISTINCT FROM NEW.assigned_to) THEN
       
        -- Update the assigned user's record
        UPDATE users
        SET 
            -- Increment the counters
            total_leads_received = COALESCE(total_leads_received, 0) + 1,
            leads_today = COALESCE(leads_today, 0) + 1,
            
            -- Automatically deactivate the user if their new count hits or exceeds their promised limit
            is_active = CASE 
                            WHEN COALESCE(total_leads_received, 0) + 1 >= COALESCE(total_leads_promised, 0) AND COALESCE(total_leads_promised, 0) > 0 THEN false 
                            ELSE is_active 
                        END,
            
            -- Keep the updated_at timestamp accurate
            updated_at = NOW()
        WHERE id = NEW.assigned_to;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Drop the trigger if it already exists (to avoid 'trigger already exists' errors)
DROP TRIGGER IF EXISTS trigger_update_user_lead_count ON leads;

-- 3. Attach the trigger to the leads table
CREATE TRIGGER trigger_update_user_lead_count
AFTER INSERT OR UPDATE ON leads
FOR EACH ROW
EXECUTE FUNCTION update_user_lead_count();
