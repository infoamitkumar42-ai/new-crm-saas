-- ============================================================================
-- 🔍 TANU DHAWAN - LEAD AUDIT (6 JAN - 7 FEB)
-- ============================================================================

-- Step 1: Get Tanu's user ID
DO $$
DECLARE
    tanu_id UUID;
BEGIN
    SELECT id INTO tanu_id FROM users WHERE email = 'dhawantanu536@gmail.com';
    RAISE NOTICE 'Tanu User ID: %', tanu_id;
END $$;

-- Step 2: Count ACTUAL leads from database
SELECT 
    COUNT(*) as actual_leads_count,
    MIN(created_at) as first_lead_date,
    MAX(created_at) as last_lead_date
FROM leads
WHERE assigned_to = (SELECT id FROM users WHERE email = 'dhawantanu536@gmail.com');

-- Step 3: Compare with counter
SELECT 
    email,
    total_leads_received as counter_value,
    (SELECT COUNT(*) FROM leads WHERE assigned_to = users.id) as actual_count,
    (SELECT COUNT(*) FROM leads WHERE assigned_to = users.id) - COALESCE(total_leads_received, 0) as difference
FROM users
WHERE email = 'dhawantanu536@gmail.com';

-- Step 4: Date-wise breakdown
SELECT 
    DATE(created_at) as date,
    COUNT(*) as leads_count
FROM leads
WHERE assigned_to = (SELECT id FROM users WHERE email = 'dhawantanu536@gmail.com')
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 35;

-- Step 5: Check if counter update trigger exists
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'leads'
  AND trigger_name LIKE '%counter%';
