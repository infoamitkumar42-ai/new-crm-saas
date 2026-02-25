-- ============================================================================
-- 🚀 BALANCED DISTRIBUTION v46 — Fairness First, Tier Priority as Tiebreaker
-- ============================================================================
-- NEW Logic:
-- 1. FAIRNESS FIRST: User with FEWEST leads today gets next lead (0 > 1 > 2...)
-- 2. TIER TIEBREAKER: When two users have EQUAL leads, higher tier wins
--    (Turbo/Boost > Manager > Supervisor > Starter)
-- 3. Random: Random jitter for final tie-break
-- 4. Atomic Selection with SKIP LOCKED preserved.
--
-- EFFECT:
-- - Round 1: Everyone gets 1 lead each (starting with turbo, then manager, etc.)
-- - Round 2: Everyone gets 2nd lead (starting with turbo, then manager, etc.)
-- - This ensures ALL users get leads, while top-tier users start each round first
-- ============================================================================

BEGIN;

DROP FUNCTION IF EXISTS public.get_best_assignee_for_team(TEXT);

CREATE OR REPLACE FUNCTION public.get_best_assignee_for_team(
    p_team_code TEXT
)
RETURNS TABLE (
    user_id UUID,
    user_name TEXT,
    user_email TEXT,
    plan_name TEXT,
    daily_limit INT,
    leads_today BIGINT,
    total_leads_received INT,
    total_leads_promised INT,
    out_user_id UUID,
    out_user_name TEXT,
    out_user_email TEXT,
    out_plan_name TEXT,
    out_daily_limit INT,
    out_leads_today BIGINT,
    out_total_received INT,
    out_total_promised INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_team_array TEXT[];
    v_selected_id UUID;
BEGIN
    -- normalize input
    v_team_array := string_to_array(REPLACE(p_team_code, ' ', ''), ',');

    -- PHASE 1: ATOMIC BALANCED SELECTION
    SELECT u.id INTO v_selected_id
    FROM users u
    WHERE u.team_code = ANY(v_team_array)
      AND u.is_active = true
      AND u.is_online = true
      AND u.role IN ('member', 'manager')
      AND (
          -- PLAN EXPIRY CHECK
          u.total_leads_received < u.total_leads_promised 
          OR u.total_leads_promised = 0 
          OR u.total_leads_promised IS NULL
      )
      AND (
          -- DAILY LIMIT CHECK
          (SELECT COUNT(*) FROM leads l 
           WHERE l.assigned_to = u.id 
           AND to_char(l.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') = to_char(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD')
          ) < u.daily_limit 
          OR u.daily_limit = 0 
          OR u.daily_limit IS NULL
      )
    ORDER BY 
        -- 🛡️ 1. FAIRNESS FIRST: User with fewest leads today ALWAYS wins
        -- This ensures a user with 0 leads beats a turbo_boost user with 3 leads
        (SELECT COUNT(*) FROM leads l 
         WHERE l.assigned_to = u.id 
         AND to_char(l.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') = to_char(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD')
        ) ASC,

        -- 🛡️ 2. TIER TIEBREAKER: When leads_today is EQUAL, higher tier goes first
        -- Turbo & Weekly Boost = 4, Manager = 3, Supervisor = 2, Starter = 1
        (CASE 
            WHEN LOWER(u.plan_name) LIKE '%turbo%' OR LOWER(u.plan_name) LIKE '%boost%' THEN 4
            WHEN LOWER(u.plan_name) LIKE '%manager%' THEN 3
            WHEN LOWER(u.plan_name) LIKE '%supervisor%' THEN 2
            WHEN LOWER(u.plan_name) LIKE '%starter%' THEN 1
            ELSE 0
        END) DESC,

        -- 🛡️ 3. RANDOM JITTER (Final tie-break within same tier + same count)
        RANDOM()
    LIMIT 1
    FOR UPDATE SKIP LOCKED; -- Parallel Safety

    -- PHASE 2: RETURN DATA
    IF v_selected_id IS NOT NULL THEN
        RETURN QUERY
        SELECT 
            eu.id AS user_id,
            eu.name AS user_name,
            eu.email AS user_email,
            eu.plan_name,
            eu.daily_limit,
            (SELECT COUNT(*) FROM leads l WHERE l.assigned_to = eu.id AND to_char(l.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') = to_char(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD')) AS leads_today,
            eu.total_leads_received,
            eu.total_leads_promised,
            -- Webhook Compatibility
            eu.id AS out_user_id,
            eu.name AS out_user_name,
            eu.email AS out_user_email,
            eu.plan_name AS out_plan_name,
            eu.daily_limit AS out_daily_limit,
            (SELECT COUNT(*) FROM leads l WHERE l.assigned_to = eu.id AND to_char(l.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') = to_char(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD')) AS out_leads_today,
            eu.total_leads_received AS out_total_received,
            eu.total_leads_promised AS out_total_promised
        FROM users eu
        WHERE eu.id = v_selected_id;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_best_assignee_for_team(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_best_assignee_for_team(TEXT) TO service_role;

COMMIT;

-- ============================================================================
-- HOW IT WORKS (Example with 3 users):
-- ============================================================================
-- User A: turbo_boost, 0 leads → Priority 1 (0 leads + tier 4)
-- User B: starter,     0 leads → Priority 2 (0 leads + tier 1)
-- User C: turbo_boost, 1 lead  → Priority 3 (1 lead  + tier 4)
--
-- ROUND 1: A gets lead (0 leads, tier 4) → B gets lead (0 leads, tier 1)
-- ROUND 2: C gets lead (1 lead, tier 4)  → A gets lead (1 lead, tier 4) → B gets lead (1 lead, tier 1)
--
-- Everyone gets leads! Turbo users start each round first but don't hog all leads.
-- ============================================================================
-- Test: SELECT * FROM get_best_assignee_for_team('TEAMFIRE');
