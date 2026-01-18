-- FIX EXISTING 897 ORPHAN LEADS: Copy user_id to assigned_to

-- Step 1: Check how many have user_id but no assigned_to
SELECT 
    'Leads with user_id but no assigned_to' as Issue,
    COUNT(*) as Count
FROM leads 
WHERE status = 'Assigned' 
AND assigned_to IS NULL 
AND user_id IS NOT NULL;

-- Step 2: FIX - Copy user_id to assigned_to
UPDATE leads 
SET assigned_to = user_id
WHERE status = 'Assigned' 
AND assigned_to IS NULL 
AND user_id IS NOT NULL;

-- Step 3: For leads where both are NULL, reset to 'New'
UPDATE leads 
SET status = 'New'
WHERE status = 'Assigned' 
AND assigned_to IS NULL 
AND user_id IS NULL;

-- Step 4: VERIFY - Should be 0 orphans now
SELECT 
    'Orphan Leads After Fix' as Check_Type,
    COUNT(*) as Count
FROM leads 
WHERE status = 'Assigned' AND assigned_to IS NULL;
