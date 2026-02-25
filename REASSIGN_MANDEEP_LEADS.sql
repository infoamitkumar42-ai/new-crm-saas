-- ============================================================================
-- 🚀 REASSIGN LEADS & DEACTIVATE MANDEEP (RAHUL)
-- ============================================================================

BEGIN;

-- 1. Identify and Reassign Today's Leads from Mandeep (Rahul) to Priyanka
-- Mandeep (Rahul): 30934450-93e3-4735-82da-192b24866735
-- Priyanka: 83a745db-997c-40e6-a02a-e00ef76320ff

UPDATE leads
SET 
    assigned_to = '83a745db-997c-40e6-a02a-e00ef76320ff',
    user_id = '83a745db-997c-40e6-a02a-e00ef76320ff',
    updated_at = NOW()
WHERE assigned_to = '30934450-93e3-4735-82da-192b24866735'
  AND assigned_at >= '2026-02-13 00:00:00+05:30';

-- 2. Deactivate Mandeep (Rahul)
UPDATE users
SET 
    is_active = false,
    daily_limit = 0,
    updated_at = NOW()
WHERE id = '30934450-93e3-4735-82da-192b24866735';

-- 3. Sync Counters (leads_today) for both
-- Priyanka's count will increase by the number of reassigned leads.
-- Rahul's count today will effectively become 0.

-- This will be handled by the next auto-sync or manual sync run.

COMMIT;

-- VERIFICATION
SELECT u.name, u.email, u.is_active, u.daily_limit,
       (SELECT COUNT(*) FROM leads l WHERE l.assigned_to = u.id AND l.assigned_at >= '2026-02-13 00:00:00+05:30') as actual_leads_today
FROM users u
WHERE u.id IN ('30934450-93e3-4735-82da-192b24866735', '83a745db-997c-40e6-a02a-e00ef76320ff');
