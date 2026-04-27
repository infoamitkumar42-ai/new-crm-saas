-- ============================================================================
-- MIGRATION: Add increment_user_lead_counters RPC
-- ============================================================================
-- Called by:
--   - supabase/functions/meta-webhook/index.ts (after direct lead INSERT)
--   - supabase/functions/process-backlog/index.ts (after backlog assignment)
--
-- Increments BOTH counters atomically in a single UPDATE:
--   - leads_today        → used for daily limit enforcement
--   - total_leads_received → used for total quota enforcement
-- ============================================================================

CREATE OR REPLACE FUNCTION public.increment_user_lead_counters(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE users
    SET
        leads_today          = COALESCE(leads_today, 0) + 1,
        total_leads_received = COALESCE(total_leads_received, 0) + 1,
        updated_at           = NOW()
    WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_user_lead_counters(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_user_lead_counters(UUID) TO service_role;
