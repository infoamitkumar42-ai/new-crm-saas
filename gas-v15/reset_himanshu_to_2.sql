
-- 1. Reset Himanshu's Daily Count to 2
UPDATE users 
SET leads_today = 2, 
    updated_at = NOW() 
WHERE name = 'Himanshu Sharma' 
  AND leads_today > 2;  -- Safety Check

-- 2. Unassign the LATEST 12 Leads given to Himanshu (Return to Pool)
WITH leads_to_reset AS (
    SELECT id 
    FROM leads 
    WHERE assigned_to = (SELECT id FROM users WHERE name = 'Himanshu Sharma' LIMIT 1)
      AND status = 'Assigned'
      AND created_at > CURRENT_DATE  -- Only Today's Leads
    ORDER BY assigned_at DESC        -- Take the NEWEST ones to remove
    LIMIT 12                         -- Unassign exactly 12
)
UPDATE leads
SET status = 'New',
    user_id = NULL,
    assigned_to = NULL,
    assigned_at = NULL
WHERE id IN (SELECT id FROM leads_to_reset);

-- 3. Verify Result
SELECT name, leads_today FROM users WHERE name = 'Himanshu Sharma';
