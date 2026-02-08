-- ============================================================================
-- 🕵️ CHECK META_PAGES SCHEMA
-- ============================================================================

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'meta_pages'
ORDER BY ordinal_position;
