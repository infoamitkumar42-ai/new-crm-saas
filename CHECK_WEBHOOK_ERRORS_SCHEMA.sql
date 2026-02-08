-- ============================================================================
-- 🕵️ CHECK WEBHOOK_ERRORS SCHEMA
-- ============================================================================

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'webhook_errors'
ORDER BY ordinal_position;
