-- ============================================================================
-- 🚜 PROCESS BACKLOG - UPDATE ONLY (Correct Fix)
-- ============================================================================
-- Issue: Previous scripts used 'assign_lead_atomically' which INSERTED new leads.
-- Solution: This script UPDATES the existing Queued leads.

DO $$
DECLARE
    r RECORD;
    v_user_record RECORD;
    v_count INT := 0;
BEGIN
    RAISE NOTICE 'Starting UPDATE of Queued leads...';

    FOR r IN 
        SELECT DISTINCT ON (l.id)
            l.id, l.name, l.phone, l.city, l.source, mp.team_id
        FROM leads l
        JOIN meta_pages mp ON TRIM(l.source) ILIKE '%' || TRIM(mp.page_name) || '%'
        WHERE l.status = 'Queued'
          AND (l.notes LIKE '%RPC Error%' OR l.notes LIKE '%Atomic assign failed%')
        ORDER BY l.id, LENGTH(mp.page_name) DESC
    LOOP
        -- 1. Find Best User
        SELECT * INTO v_user_record 
        FROM get_best_assignee_for_team(r.team_id)
        LIMIT 1;

        IF v_user_record.user_id IS NOT NULL THEN
            -- 2. UPDATE existing lead (No INSERT)
            UPDATE leads
            SET assigned_to = v_user_record.user_id,
                status = 'Assigned',
                assigned_at = NOW(),
                notes = 'Recovered from RPC Error',
                updated_at = NOW()
            WHERE id = r.id;

            -- 3. Update User Counter manually (since we bypassed atomic function)
            UPDATE users
            SET leads_today = leads_today + 1,
                total_leads_received = total_leads_received + 1,
                updated_at = NOW()
            WHERE id = v_user_record.user_id;
            
            v_count := v_count + 1;
        END IF;

    END LOOP;

    RAISE NOTICE '🎉 Update Complete. Total Updated: %', v_count;
END $$;
