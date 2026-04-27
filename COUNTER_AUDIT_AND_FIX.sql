-- ============================================================
-- COUNTER AUDIT + FIX — March vs April Users
-- Run each STEP separately in Supabase SQL Editor
-- Date: 2026-04-05
-- ============================================================

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 1: ANALYZE current state
-- Run this FIRST — read only, no changes
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WITH plan_config AS (
  SELECT 'starter'     AS plan_name, 55  AS total_leads UNION ALL
  SELECT 'supervisor',                   115              UNION ALL
  SELECT 'weekly_boost',                  92              UNION ALL
  SELECT 'turbo_boost',                  108              UNION ALL
  SELECT 'manager',                      150
)
SELECT
    u.email,
    u.plan_name,
    u.plan_start_date::date,
    u.total_leads_received    AS delivered,
    u.total_leads_promised    AS current_promise,
    pc.total_leads            AS plan_default,

    -- How many plan cycles purchased (handles renewals)
    CEIL(u.total_leads_promised::numeric / pc.total_leads) AS plans_purchased,

    -- What they SHOULD have been promised
    CEIL(u.total_leads_promised::numeric / pc.total_leads) * pc.total_leads AS corrected_promise,

    -- Remaining after correction
    (CEIL(u.total_leads_promised::numeric / pc.total_leads) * pc.total_leads)
      - u.total_leads_received AS remaining,

    -- Status flag
    CASE
        WHEN u.total_leads_received >= (CEIL(u.total_leads_promised::numeric / pc.total_leads) * pc.total_leads)
        THEN 'SHOULD_EXPIRE'
        WHEN (CEIL(u.total_leads_promised::numeric / pc.total_leads) * pc.total_leads)
             - u.total_leads_received <= 10
        THEN 'URGENT'
        ELSE 'ACTIVE'
    END AS status,

    -- March or April?
    CASE
        WHEN u.plan_start_date < '2026-04-01' THEN 'MARCH'
        ELSE 'APRIL'
    END AS cohort

FROM users u
JOIN plan_config pc ON u.plan_name = pc.plan_name
WHERE u.payment_status = 'active'
  AND u.plan_name != 'none'
ORDER BY remaining;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 2: FIX MARCH USERS — correct total_leads_promised
-- Only updates plan_start_date < 2026-04-01
-- Does NOT touch April users
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Preview first (no changes):
WITH plan_config AS (
  SELECT 'starter'     AS plan_name, 55  AS total_leads UNION ALL
  SELECT 'supervisor',                   115              UNION ALL
  SELECT 'weekly_boost',                  92              UNION ALL
  SELECT 'turbo_boost',                  108              UNION ALL
  SELECT 'manager',                      150
)
SELECT
    u.id,
    u.email,
    u.plan_name,
    u.total_leads_promised   AS old_promise,
    CEIL(u.total_leads_promised::numeric / pc.total_leads) * pc.total_leads AS new_promise,
    u.total_leads_received   AS delivered,
    (CEIL(u.total_leads_promised::numeric / pc.total_leads) * pc.total_leads)
      - u.total_leads_received AS new_remaining
FROM users u
JOIN plan_config pc ON u.plan_name = pc.plan_name
WHERE u.payment_status = 'active'
  AND u.plan_name != 'none'
  AND u.plan_start_date < '2026-04-01'
ORDER BY new_remaining;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 3: APPLY FIX — Update total_leads_promised for March users
-- Run ONLY after verifying STEP 2 preview looks correct
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WITH plan_config AS (
  SELECT 'starter'     AS plan_name, 55  AS total_leads UNION ALL
  SELECT 'supervisor',                   115              UNION ALL
  SELECT 'weekly_boost',                  92              UNION ALL
  SELECT 'turbo_boost',                  108              UNION ALL
  SELECT 'manager',                      150
)
UPDATE users u
SET total_leads_promised =
    CEIL(u.total_leads_promised::numeric / pc.total_leads) * pc.total_leads
FROM plan_config pc
WHERE u.plan_name = pc.plan_name
  AND u.payment_status = 'active'
  AND u.plan_name != 'none'
  AND u.plan_start_date < '2026-04-01';

-- Should return: UPDATE N (N = number of March users updated)


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 4: EXPIRE users who have remaining <= 0
-- (March users who got more than promised)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Preview first:
SELECT id, email, plan_name, total_leads_received, total_leads_promised,
       total_leads_received - total_leads_promised AS over_delivered
FROM users
WHERE payment_status = 'active'
  AND plan_name != 'none'
  AND total_leads_received >= total_leads_promised
  AND plan_start_date < '2026-04-01';

-- Apply expiry (run after preview confirms correct users):
UPDATE users
SET
    payment_status = 'expired',
    is_active      = false,
    is_online      = false,
    daily_limit    = 0
WHERE payment_status = 'active'
  AND plan_name != 'none'
  AND total_leads_received >= total_leads_promised
  AND plan_start_date < '2026-04-01';


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 5: FINAL VERIFICATION
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT
    CASE WHEN plan_start_date < '2026-04-01' THEN 'MARCH' ELSE 'APRIL' END AS cohort,
    payment_status,
    COUNT(*)                               AS users,
    SUM(total_leads_received)              AS total_delivered,
    SUM(total_leads_promised)              AS total_promised,
    SUM(total_leads_promised - total_leads_received) AS total_remaining
FROM users
WHERE plan_name != 'none'
GROUP BY cohort, payment_status
ORDER BY cohort, payment_status;
