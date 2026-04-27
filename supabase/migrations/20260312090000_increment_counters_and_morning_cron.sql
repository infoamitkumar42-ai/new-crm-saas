-- ============================================================================
-- 🔧 MIGRATION: increment_user_lead_counters + Morning Backlog Cron
-- File: supabase/migrations/20260312090000_increment_counters_and_morning_cron.sql
-- Fixes:
--   1. Creates increment_user_lead_counters RPC (used by meta-webhook + process-backlog)
--   2. Schedules morning cron to auto-distribute Night_Backlog leads at 8 AM IST
-- ============================================================================

-- ============================================================================
-- 1. CREATE increment_user_lead_counters RPC
-- ============================================================================
-- Used by:
--   - supabase/functions/meta-webhook/index.ts (after direct lead assignment)
--   - supabase/functions/process-backlog/index.ts (after backlog assignment)
--
-- Note: leads_today is also updated directly in process-backlog for accuracy.
-- This RPC only increments total_leads_received (the lifetime counter).

CREATE OR REPLACE FUNCTION public.increment_user_lead_counters(
    p_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE users
    SET
        total_leads_received = COALESCE(total_leads_received, 0) + 1,
        updated_at = NOW()
    WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_user_lead_counters(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_user_lead_counters(UUID) TO authenticated;

-- ============================================================================
-- 2. MORNING BACKLOG CRON — Auto-process Night_Backlog at 8 AM IST (2:30 AM UTC)
-- ============================================================================
-- Requires: pg_cron + pg_net enabled in Supabase Dashboard
-- Enable: Dashboard → Database → Extensions → search pg_cron, pg_net → Enable both
--
-- Run this separately in Supabase SQL Editor (NOT as a migration):
--
-- SELECT cron.schedule(
--     'morning-backlog-processor',
--     '30 2 * * *',    -- 2:30 AM UTC = 8:00 AM IST daily
--     $$
--     SELECT net.http_post(
--         url := 'https://vewqzsqddgmkslnuctvb.supabase.co/functions/v1/process-backlog',
--         headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us"}'::jsonb,
--         body := '{}'::jsonb
--     );
--     $$
-- );

-- ============================================================================
-- ✅ VERIFY
-- ============================================================================
-- SELECT * FROM cron.job WHERE jobname = 'morning-backlog-processor';
-- SELECT * FROM pg_proc WHERE proname = 'increment_user_lead_counters';
