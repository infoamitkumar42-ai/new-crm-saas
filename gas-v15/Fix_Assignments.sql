-- ============================================================================
-- FIX ASSIGNMENTS & DISTRIBUTE CORRECTLY (SAFE VERSION)
-- ============================================================================
-- 1. Reset Gurnam's leads to 0 (Rollback recent assignments)
-- 2. Distribute exactly: Rajwinder (20), Sunny (18), Gurnam (18)
-- ============================================================================

DO $$ 
DECLARE 
    rajwinder_id uuid;
    sunny_id uuid;
    gurnam_id uuid;
BEGIN
    -- 1. ROLLBACK: Unassign leads given to Gurnam in the last hour
    -- This resets the "126 leads" error
    UPDATE leads 
    SET user_id = NULL, status = 'New'
    WHERE user_id = (SELECT id FROM users WHERE email = 'gurnambal01@gmail.com')
      AND assigned_at > NOW() - INTERVAL '1 hour';

    -- 2. GET USER IDs (Case Insensitive)
    SELECT id INTO rajwinder_id FROM users WHERE LOWER(email) = LOWER('workwithrajwinder@gmail.com') LIMIT 1;
    SELECT id INTO sunny_id FROM users WHERE LOWER(email) = LOWER('Sunnymehre451@gmail.com') LIMIT 1;
    SELECT id INTO gurnam_id FROM users WHERE LOWER(email) = LOWER('gurnambal01@gmail.com') LIMIT 1;

    -- 3. RE-ASSIGN: Rajwinder (First 20)
    IF rajwinder_id IS NOT NULL THEN
        UPDATE leads 
        SET user_id = rajwinder_id, assigned_at = NOW(), status = 'Assigned'
        WHERE id IN (
            SELECT id FROM leads 
            WHERE user_id IS NULL 
              AND created_at >= '2026-01-08 00:00:00'
            ORDER BY created_at ASC 
            LIMIT 20
        );
    END IF;

    -- 4. RE-ASSIGN: Sunny (Next 18)
    IF sunny_id IS NOT NULL THEN
        UPDATE leads 
        SET user_id = sunny_id, assigned_at = NOW(), status = 'Assigned'
        WHERE id IN (
            SELECT id FROM leads 
            WHERE user_id IS NULL 
              AND created_at >= '2026-01-08 00:00:00'
            ORDER BY created_at ASC 
            LIMIT 18
        );
    END IF;

    -- 5. RE-ASSIGN: Gurnam (Next 18 - SAFE LIMIT)
    -- Restricted to 18 to prevent flooding him with backlog leads
    IF gurnam_id IS NOT NULL THEN
        UPDATE leads 
        SET user_id = gurnam_id, assigned_at = NOW(), status = 'Assigned'
        WHERE id IN (
            SELECT id FROM leads 
            WHERE user_id IS NULL 
              AND created_at >= '2026-01-08 00:00:00'
            ORDER BY created_at ASC
            LIMIT 18 
        );
    END IF;

END $$;

-- Verify Results
SELECT 
    u.name, 
    COUNT(l.id) as assigned_since_reset
FROM leads l
JOIN users u ON l.user_id = u.id
WHERE l.assigned_at > NOW() - INTERVAL '5 minutes'
GROUP BY u.name;
