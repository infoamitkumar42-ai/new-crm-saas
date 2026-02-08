-- ============================================================================
-- 🕵️ VIEW TRIGGER DEFINITION
-- ============================================================================

SELECT 
    trig.tgname as trigger_name,
    proc.prosrc as trigger_definition
FROM pg_trigger trig
JOIN pg_proc proc ON trig.tgfoid = proc.oid
WHERE trig.tgname = 'check_lead_limit_before_insert';
