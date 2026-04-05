-- ============================================================
-- UPDATE: assign_recycled_leads RPC — Week 1 Test Config
-- Run this in Supabase SQL Editor
-- Date: 2026-04-05
-- ============================================================

-- STEP 1: Update assign_recycled_leads RPC
-- Changes:
--   - Status filter: only 'Call Back', 'Fresh', 'fresh'
--   - Time window: 2-6 months old (was 7-90 days)
--   - Same phone block: don't reassign same phone to same user
--   - Priority: Call Back first, then Fresh (newer first)
-- ============================================================

CREATE OR REPLACE FUNCTION assign_recycled_leads(
  p_user_id UUID,
  p_count   INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_assigned INTEGER := 0;
  v_lead     RECORD;
BEGIN
  -- Loop through eligible recycled leads
  FOR v_lead IN
    SELECT l.id
    FROM leads l
    -- Lead must belong to a different user who is inactive/expired
    JOIN users u ON u.id = l.assigned_to
    WHERE
      -- Only these statuses (PART 1)
      l.status IN ('Call Back', 'Fresh', 'fresh')

      -- Lead must be assigned to someone other than the target user
      AND l.assigned_to IS NOT NULL
      AND l.assigned_to <> p_user_id

      -- The original assignee must be inactive or expired
      AND (
        u.is_active = false
        OR u.payment_status IN ('inactive', 'expired')
      )

      -- Time window: 2 to 6 months old (PART 2)
      AND l.created_at > NOW() - INTERVAL '6 months'
      AND l.created_at < NOW() - INTERVAL '2 months'

      -- Not already seen this phone (PART 3)
      AND NOT EXISTS (
        SELECT 1 FROM leads prev
        WHERE prev.assigned_to = p_user_id
          AND prev.phone = l.phone
          AND prev.id <> l.id
      )

      -- Not already a recycled lead assigned to target
      AND NOT (l.assigned_to = p_user_id AND l.lead_type = 'recycled')

    -- Priority: Call Back first, then Fresh, newer first (PART 4)
    ORDER BY
      CASE l.status
        WHEN 'Call Back' THEN 1
        WHEN 'Fresh'     THEN 2
        WHEN 'fresh'     THEN 2
        ELSE 3
      END ASC,
      l.created_at DESC

    LIMIT p_count
    FOR UPDATE SKIP LOCKED
  LOOP
    -- Reassign lead to target user
    UPDATE leads
    SET
      assigned_to     = p_user_id,
      assigned_at     = NOW(),
      status          = 'Fresh',
      lead_type       = 'recycled',
      original_status = v_lead.id::text  -- store original lead id reference
    WHERE id = v_lead.id;

    -- Increment counters atomically
    UPDATE users
    SET
      leads_today              = COALESCE(leads_today, 0) + 1,
      total_leads_received     = COALESCE(total_leads_received, 0) + 1,
      recycled_leads_received  = COALESCE(recycled_leads_received, 0) + 1
    WHERE id = p_user_id;

    v_assigned := v_assigned + 1;
  END LOOP;

  RETURN v_assigned;
END;
$$;


-- ============================================================
-- STEP 2: Update system_config recycled_daily limits
-- ============================================================

UPDATE system_config
SET config_value = jsonb_set(
  config_value,
  '{starter,recycled_daily}',
  '2'
)
WHERE config_key = 'plan_fresh_config';

UPDATE system_config
SET config_value = jsonb_set(
  config_value,
  '{supervisor,recycled_daily}',
  '2'
)
WHERE config_key = 'plan_fresh_config';

UPDATE system_config
SET config_value = jsonb_set(
  config_value,
  '{weekly_boost,recycled_daily}',
  '5'
)
WHERE config_key = 'plan_fresh_config';

UPDATE system_config
SET config_value = jsonb_set(
  config_value,
  '{turbo_boost,recycled_daily}',
  '4'
)
WHERE config_key = 'plan_fresh_config';


-- ============================================================
-- VERIFY: Check system_config after update
-- ============================================================

SELECT
  config_value->>'starter'      AS starter,
  config_value->>'supervisor'   AS supervisor,
  config_value->>'weekly_boost' AS weekly_boost,
  config_value->>'turbo_boost'  AS turbo_boost
FROM system_config
WHERE config_key = 'plan_fresh_config';


-- ============================================================
-- STEP 3: Test RPC (replace USER_UUID with real UUID)
-- ============================================================

-- SELECT assign_recycled_leads('USER_UUID_YAHAN', 2);

-- Check assigned leads:
-- SELECT id, name, phone, status, lead_type, original_status, assigned_at
-- FROM leads
-- WHERE assigned_to = 'USER_UUID_YAHAN'
-- AND lead_type = 'recycled'
-- ORDER BY assigned_at DESC
-- LIMIT 5;
