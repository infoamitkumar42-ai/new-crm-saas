-- ============================================================================
-- 🕵️ INSPECT ROUND-ROBIN LOGIC
-- ============================================================================

SELECT 
    proname as function_name,
    prosrc as function_definition
FROM pg_proc 
WHERE proname = 'get_best_assignee_for_team';
