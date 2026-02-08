-- ============================================================================
-- �️ CHECK POOJA JOLLY'S LEADS & FIX VISIBILITY (Safe Version)
-- ============================================================================

-- Query 1: Check Pooja Jolly's leads today
SELECT 
    u.name,
    u.daily_limit,
    u.leads_today,
    COUNT(l.id) as actual_leads_count,
    STRING_AGG(l.status, ', ') as statuses
FROM users u
LEFT JOIN leads l ON l.assigned_to = u.id AND l.created_at >= CURRENT_DATE
WHERE u.name ILIKE '%Pooja Jolly%'
GROUP BY u.id, u.name, u.daily_limit, u.leads_today;


-- Query 2: SYNC VISIBILITY (Safe Mode)
-- Instead of DISABLE TRIGGER ALL, we use DISABLE TRIGGER USER
-- This disables custom triggers (like check_lead_limit) but keeps system triggers (FKs) safe.

BEGIN;

-- 1. Disable Custom Triggers
ALTER TABLE leads DISABLE TRIGGER USER;

-- 2. Update the leads (Sync assigned_to -> user_id)
UPDATE leads
SET user_id = assigned_to
WHERE notes LIKE '%Force Distributed%'
  AND user_id IS NULL
  AND assigned_to IS NOT NULL;

-- 3. Re-Enable Custom Triggers
ALTER TABLE leads ENABLE TRIGGER USER;

-- 4. Verify Result
SELECT 
    COUNT(*) as visible_now,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as still_hidden
FROM leads
WHERE notes LIKE '%Force Distributed%';

COMMIT;
