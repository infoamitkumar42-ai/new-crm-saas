-- ============================================================================
-- ⚡ FORCE DISTRIBUTE WAITING LEADS (Round Robin to Active Users)
-- ============================================================================
-- Logic:
-- 1. Find all waiting leads (Night_Backlog/Queued)
-- 2. Find ACTIVE team members for each lead (ignoring online/quota for now to force clear)
-- 3. Pick the user with FEWEST leads today (Balancing)
-- 4. Assign and update counters

BEGIN;

-- 1. Perform Assignment
WITH assignments AS (
    SELECT 
        l.id AS lead_id,
        (
            SELECT u.id 
            FROM users u
            JOIN meta_pages mp ON mp.team_id = u.team_code
            WHERE l.source LIKE '%' || mp.page_name || '%'  -- Match page to team
              AND u.is_active = true                       -- Only Active Users
              AND u.role IN ('member', 'manager')
            ORDER BY u.leads_today ASC, u.id ASC            -- Balance Load
            LIMIT 1
        ) AS best_user_id
    FROM leads l
    WHERE l.status IN ('Night_Backlog', 'Queued')
      AND l.assigned_to IS NULL
)
UPDATE leads
SET 
    assigned_to = a.best_user_id,
    assigned_at = NOW(),
    status = 'Assigned',
    notes = COALESCE(notes, '') || ' [Force Distributed]'
FROM assignments a
WHERE leads.id = a.lead_id
  AND a.best_user_id IS NOT NULL; -- Only update if we found a user

-- 2. Sync Counters for Affected Users
UPDATE users u
SET 
    leads_today = (
        SELECT COUNT(*) 
        FROM leads 
        WHERE assigned_to = u.id 
          AND created_at >= CURRENT_DATE
    ),
    total_leads_received = (
        SELECT COUNT(*) 
        FROM leads 
        WHERE assigned_to = u.id
    )
WHERE id IN (
    SELECT assigned_to 
    FROM leads 
    WHERE status = 'Assigned' 
      AND created_at >= CURRENT_DATE
);

-- 3. Verify Results
SELECT 
    l.source,
    u.team_code,
    COUNT(*) as assigned_count
FROM leads l
JOIN users u ON l.assigned_to = u.id
WHERE l.notes LIKE '%Force Distributed%'
GROUP BY 1, 2;

COMMIT;
