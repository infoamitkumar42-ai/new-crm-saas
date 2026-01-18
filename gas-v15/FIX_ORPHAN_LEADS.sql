-- FIX 897 ORPHAN LEADS: Reset them to 'New' status

-- Step 1: See sample of orphan leads
SELECT id, name, phone, city, source, created_at
FROM leads 
WHERE status = 'Assigned' AND assigned_to IS NULL
LIMIT 10;

-- Step 2: FIX - Reset all orphans to 'New' so they can be properly assigned
UPDATE leads 
SET status = 'New'
WHERE status = 'Assigned' 
AND assigned_to IS NULL;

-- Step 3: Verify fix
SELECT 
    'Orphan Leads After Fix' as Check_Type,
    COUNT(*) as Count
FROM leads 
WHERE status = 'Assigned' AND assigned_to IS NULL;

-- Step 4: Count how many are now available for assignment
SELECT 
    'Available for Assignment' as Check_Type,
    COUNT(*) as Count
FROM leads 
WHERE assigned_to IS NULL 
AND status = 'New'
AND is_valid_phone = true;
