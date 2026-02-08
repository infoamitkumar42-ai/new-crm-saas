-- ============================================================================
-- 🕵️ CHECK USERS TABLE SCHEMA
-- ============================================================================

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY column_name;
