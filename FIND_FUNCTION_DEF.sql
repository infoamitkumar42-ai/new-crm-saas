-- ============================================================================
-- 🕵️ FIND FUNCTION DEFINITION
-- ============================================================================

SELECT 
    proname as function_name,
    prosrc as function_definition
FROM pg_proc 
WHERE proname ILIKE '%check_lead_limit%';
