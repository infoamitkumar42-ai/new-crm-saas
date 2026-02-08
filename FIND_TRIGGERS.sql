-- ============================================================================
-- 🔧 FIND AND DISABLE ALL TRIGGERS ON LEADS TABLE
-- ============================================================================

-- Step 1: Find all triggers on leads table
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'leads'
ORDER BY trigger_name;
