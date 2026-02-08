-- ============================================================================
-- 🕵️ CHECK LAST LEAD TIME (Simply)
-- ============================================================================

SELECT 
    NOW() at time zone 'utc' as current_time_utc,
    MAX(created_at) as last_lead_time_utc,
    EXTRACT(EPOCH FROM (NOW() - MAX(created_at))) / 60 as minutes_ago
FROM leads;
