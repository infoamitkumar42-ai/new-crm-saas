-- ============================================================================
-- 🕵️ CHECK SYSTEM VITALS (Is anything "Stuck"?)
-- ============================================================================

-- Check 1: EXACT TIME of the very last lead
SELECT 
    NOW() as system_time,
    led.created_at as last_lead_time,
    NOW() - led.created_at as time_since_last_lead,
    (SELECT COUNT(*) FROM leads WHERE assigned_to IS NULL AND created_at >= CURRENT_DATE) as leads_waiting
FROM leads led
ORDER BY created_at DESC
LIMIT 1;

-- Check 2: Did the webhook log any errors?
-- This table was created in our migration.
SELECT * FROM webhook_errors 
ORDER BY created_at DESC 
LIMIT 5;

-- Check 3: Raw Lead Count for Today
SELECT COUNT(*) as total_leads_today FROM leads WHERE created_at >= CURRENT_DATE;
