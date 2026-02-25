-- ============================================================================
-- 🚀 RELEASE STUCK LEAD - PHASE 70
-- ============================================================================

BEGIN;

-- 1. Assign Uday Singh to Manish
UPDATE leads
SET assigned_to = 'e03ec0de-1c1a-4ef4-82d3-4a22919c69bb', -- Manish
    user_id = 'e03ec0de-1c1a-4ef4-82d3-4a22919c69bb',
    status = 'Assigned',
    assigned_at = NOW(),
    updated_at = NOW(),
    notes = 'Manually released from queue'
WHERE id = '4961693f-abad-41b0-ae52-e59a2aefd74f';

-- 2. Update Manish's counter
UPDATE users
SET leads_today = leads_today + 1
WHERE id = 'e03ec0de-1c1a-4ef4-82d3-4a22919c69bb';

COMMIT;

-- VERIFICATION
SELECT name, status, assigned_to, user_id, updated_at
FROM leads
WHERE id = '4961693f-abad-41b0-ae52-e59a2aefd74f';
