-- =====================================================
-- SAFE ASSIGN: Only assign leads that are NOT duplicates
-- Date: 2026-01-14
-- =====================================================

-- Step 1: Assign 50 SAFE leads (no duplicates) - RUN THIS
UPDATE leads l
SET 
    user_id = matched.user_id,
    status = 'Assigned',
    assigned_at = NOW(),
    updated_at = NOW()
FROM (
    SELECT 
        safe_leads.id as lead_id,
        users_ranked.id as user_id
    FROM (
        SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
        FROM leads new_lead
        WHERE new_lead.created_at >= CURRENT_DATE
          AND new_lead.status = 'New'
          AND new_lead.user_id IS NULL
          -- Exclude duplicates
          AND NOT EXISTS (
              SELECT 1 FROM leads existing 
              WHERE existing.phone = new_lead.phone 
                AND existing.id != new_lead.id
                AND existing.status = 'Assigned'
          )
        LIMIT 50
    ) safe_leads
    JOIN (
        SELECT id, ROW_NUMBER() OVER (ORDER BY leads_today, id) as rn
        FROM users
        WHERE is_active = true
          AND plan_name IS NOT NULL
          AND plan_name != 'none'
          AND leads_today < daily_limit
          AND last_activity >= CURRENT_DATE
        LIMIT 50
    ) users_ranked ON safe_leads.rn = users_ranked.rn
) matched
WHERE l.id = matched.lead_id;

-- Step 2: Update all user counts - RUN THIS AFTER
UPDATE users u
SET leads_today = (
    SELECT COUNT(*) 
    FROM leads l 
    WHERE l.user_id = u.id 
      AND l.created_at >= CURRENT_DATE 
      AND l.status = 'Assigned'
),
updated_at = NOW()
WHERE is_active = true;

-- Step 3: Check remaining New leads
SELECT COUNT(*) as remaining_new_leads
FROM leads
WHERE created_at >= CURRENT_DATE
  AND status = 'New'
  AND user_id IS NULL;

-- Step 4: Mark duplicate as Duplicate status
UPDATE leads
SET status = 'Duplicate', updated_at = NOW()
WHERE created_at >= CURRENT_DATE
  AND status = 'New'
  AND user_id IS NULL
  AND EXISTS (
      SELECT 1 FROM leads existing 
      WHERE existing.phone = leads.phone 
        AND existing.id != leads.id
        AND existing.status = 'Assigned'
  );

-- Step 5: Final Distribution Check
SELECT 
    name, plan_name, daily_limit, leads_today,
    (daily_limit - leads_today) as can_still_receive
FROM users
WHERE is_active = true
  AND plan_name IS NOT NULL
  AND plan_name != 'none'
ORDER BY leads_today DESC;
