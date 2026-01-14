-- ============================================================================
-- 🕵️ CHECK SPECIFIC LEAD STATUS (Bandwidth Error Investigation)
-- ============================================================================

SELECT id, name, status, assigned_at, user_id, source
FROM leads
WHERE id = 'd2c8adee-9b0a-424e-af4e-eabb75293f95';
