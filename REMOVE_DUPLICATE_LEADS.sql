-- ============================================================================
-- 🧹 REMOVE DUPLICATE LEADS & FIX COUNTERS
-- ============================================================================
-- Issue: Multiple leads created for the same phone number due to retry logic.
-- Fix: Keep the OLDEST lead, delete the newer duplicates.

DO $$
DECLARE
    r RECORD;
    v_deleted_count INT := 0;
BEGIN
    RAISE NOTICE 'Starting Duplicate Cleanup...';

    -- Loop through duplicates
    FOR r IN 
        SELECT phone, ARRAY_AGG(id ORDER BY created_at ASC) as ids
        FROM leads
        WHERE created_at >= CURRENT_DATE
        GROUP BY phone
        HAVING COUNT(*) > 1
    LOOP
        -- Delete all IDs except the first one (ids[1])
        DELETE FROM leads 
        WHERE id = ANY(r.ids[2:array_length(r.ids, 1)]);
        
        v_deleted_count := v_deleted_count + (array_length(r.ids, 1) - 1);
    END LOOP;

    RAISE NOTICE '🎉 Cleanup Complete. Deleted % duplicate leads.', v_deleted_count;

    -- Re-sync Counters for ALL users (safest approach)
    UPDATE users u
    SET 
        leads_today = (
            SELECT COUNT(*) 
            FROM leads l 
            WHERE l.user_id = u.id 
              AND l.created_at >= CURRENT_DATE
        ),
        total_leads_received = (
            SELECT COUNT(*) 
            FROM leads l 
            WHERE l.user_id = u.id
        ),
        updated_at = NOW();
        
    RAISE NOTICE '✅ Counters Resynced.';
END $$;
