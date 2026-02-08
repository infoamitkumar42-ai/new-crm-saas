-- ============================================================================
-- 🕵️ FIND ALL TRIGGERS ON LEADS TABLE
-- ============================================================================

SELECT 
    tgname as trigger_name,
    tgenabled as status -- 'O' = enabled, 'D' = disabled
FROM pg_trigger 
WHERE tgrelid = 'leads'::regclass;
