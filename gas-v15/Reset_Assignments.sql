-- ============================================================================
-- STEP 1: RESET / REMOVE INCORRECT ASSIGNMENTS
-- ============================================================================
-- This script removes leads that were just assigned to Rajwinder, Sunny, and Gurnam.
-- It works by unassigning any leads given to them in the last 4 hours.
-- ============================================================================

DO $$ 
DECLARE 
    rajwinder_id uuid;
    sunny_id uuid;
    gurnam_id uuid;
BEGIN
    -- 1. Get User IDs (Case Insensitive)
    SELECT id INTO rajwinder_id FROM users WHERE LOWER(email) = LOWER('workwithrajwinder@gmail.com') LIMIT 1;
    SELECT id INTO sunny_id FROM users WHERE LOWER(email) = LOWER('Sunnymehre451@gmail.com') LIMIT 1;
    SELECT id INTO gurnam_id FROM users WHERE LOWER(email) = LOWER('gurnambal01@gmail.com') LIMIT 1;

    -- 2. UNASSIGN LEADS (Reset to 'New')
    -- Targets (Rajwinder, Sunny, Gurnam) and creates within the last 4 hours (safety window)

    IF rajwinder_id IS NOT NULL THEN
        UPDATE leads 
        SET user_id = NULL, status = 'New', assigned_at = NULL
        WHERE user_id = rajwinder_id 
          AND assigned_at > NOW() - INTERVAL '4 hours';
    END IF;

    IF sunny_id IS NOT NULL THEN
        UPDATE leads 
        SET user_id = NULL, status = 'New', assigned_at = NULL
        WHERE user_id = sunny_id 
          AND assigned_at > NOW() - INTERVAL '4 hours';
    END IF;

    IF gurnam_id IS NOT NULL THEN
        UPDATE leads 
        SET user_id = NULL, status = 'New', assigned_at = NULL
        WHERE user_id = gurnam_id 
          AND assigned_at > NOW() - INTERVAL '4 hours';
    END IF;

END $$;

-- Verify Dashboards are Empty (for recent leads)
SELECT 
    u.name, 
    COUNT(l.id) as remaining_leads_assigned_in_last_4h
FROM leads l
JOIN users u ON l.user_id = u.id
WHERE l.assigned_at > NOW() - INTERVAL '4 hours'
GROUP BY u.name;
