-- ============================================================================
-- 🔍 CHECK META_PAGES TABLE STRUCTURE
-- ============================================================================

-- Query 1: Get all column names
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'meta_pages'
ORDER BY ordinal_position;

-- Query 2: Simple check - see what columns actually exist
SELECT * FROM meta_pages LIMIT 1;
