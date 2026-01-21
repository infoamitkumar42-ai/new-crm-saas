
-- 1. Reset Himanshu's Counter to 2 (Since we will keep 2 leads)
UPDATE users 
SET leads_today = 2,
    updated_at = NOW()
WHERE name = 'Himanshu Sharma' 
  AND leads_today > 2;

-- 2. Recycle Excess Leads (Keep Oldest 2, Unassign the Rest)
WITH leads_to_recycle AS (
    SELECT id 
    FROM leads 
    WHERE assigned_to = (SELECT id FROM users WHERE name = 'Himanshu Sharma' LIMIT 1)
      AND status = 'Assigned'
      AND created_at > CURRENT_DATE -- Only Today's
    ORDER BY assigned_at DESC     -- Newest First
    OFFSET 2                      -- Skip the 2 we want to KEEP (Oldest ones will be at bottom, checking Logic)
                                  -- Wait, ORDER BY DESC means Top is Newest. 
                                  -- OFFSET 2 means Skip Top 2 Newest? NO.
                                  -- We want to KEEP Oldest. 
                                  -- So we select ALL except Oldest 2?
                                  -- Better Logic: Select IDs NOT IN (Select Top 2 Ascending) 
)
-- Let's re-write for absolute safety:
-- Select IDs of leads to UNASSIGN (Everything except the first 2 he got)
, target_leads AS (
   SELECT id FROM leads
   WHERE assigned_to = (SELECT id FROM users WHERE name = 'Himanshu Sharma' LIMIT 1)
     AND status = 'Assigned'
     AND created_at > CURRENT_DATE
   ORDER BY assigned_at ASC -- Oldest First. 
   OFFSET 2                 -- Skip the first 2 (Keep them). Select the REST.
)

UPDATE leads
SET status = 'New',
    user_id = NULL,
    assigned_to = NULL,
    assigned_at = NULL
WHERE id IN (SELECT id FROM target_leads);

-- 3. Verify
SELECT count(*) as himanshu_leads_now 
FROM leads 
WHERE assigned_to = (SELECT id FROM users WHERE name = 'Himanshu Sharma' LIMIT 1) 
  AND status = 'Assigned' 
  AND created_at > CURRENT_DATE;
