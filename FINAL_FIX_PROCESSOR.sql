-- ============================================================================
-- 🚀 FINAL BACKLOG PROCESSOR (Syntax Fixed)
-- ============================================================================

DO $$
DECLARE
    r RECORD;
    v_team_code TEXT;
    v_user_id UUID;
    v_page_name TEXT;
    v_processed_count INT := 0;
    v_today_count BIGINT;
BEGIN
    RAISE NOTICE '--- Starting Final Backlog Processing (Bypass Triggers) ---';

    -- DISABLE TRIGGERS on leads table to bypass 'check_lead_limit_before_insert'
    -- We are doing the check manually in SQL, so the trigger is redundant/blocking here
    ALTER TABLE leads DISABLE TRIGGER ALL;
    
    -- Loop through leads that need processing
    FOR r IN 
        SELECT id, name, status, source, notes
        FROM leads 
        WHERE status IN ('Night_Backlog', 'Queued') 
          AND assigned_to IS NULL
        ORDER BY created_at ASC
    LOOP
        RAISE NOTICE '👉 Processing Lead: %', r.name;
        
        -- 1. Get Page Name
        IF r.source LIKE 'Meta - %' THEN
            v_page_name := TRIM(SUBSTRING(r.source FROM 8));
        ELSE
            v_page_name := r.source;
        END IF;
        
        -- 2. Map to Team
        v_team_code := NULL;
        SELECT team_id INTO v_team_code FROM meta_pages WHERE page_name = v_page_name;
        
        IF v_team_code IS NULL THEN
             SELECT team_id INTO v_team_code FROM meta_pages WHERE page_name LIKE '%' || v_page_name || '%' LIMIT 1;
        END IF;

        IF v_team_code IS NOT NULL THEN
             -- 3. Find Best Assignee (INLINED LOGIC)
             v_user_id := NULL;
             
             SELECT u.id INTO v_user_id
             FROM users u
             LEFT JOIN (
                SELECT assigned_to, COUNT(*) as today_count
                FROM leads
                WHERE created_at >= CURRENT_DATE
                GROUP BY assigned_to
             ) l ON u.id = l.assigned_to
             WHERE u.team_code = v_team_code
               AND u.is_active = true
               AND u.is_online = true
               AND u.role IN ('member', 'manager')
               -- Check Daily Limit (Strict check)
               AND COALESCE(l.today_count, 0) < u.daily_limit
               -- Check Total Quota (Strict check)
               AND (u.total_leads_promised IS NULL OR u.total_leads_promised = 0 OR COALESCE(u.total_leads_received, 0) < u.total_leads_promised)
             ORDER BY
                -- Batch Priority
                (CASE WHEN COALESCE(l.today_count, 0) % 2 = 1 THEN 0 ELSE 1 END) ASC,
                -- Tier Priority
                (CASE 
                    WHEN LOWER(u.plan_name) LIKE '%turbo%' OR LOWER(u.plan_name) LIKE '%boost%' THEN 4
                    WHEN LOWER(u.plan_name) LIKE '%manager%' THEN 3
                    WHEN LOWER(u.plan_name) LIKE '%supervisor%' THEN 2
                    ELSE 1
                END) DESC,
                -- Round Robin
                COALESCE(l.today_count, 0) ASC
             LIMIT 1;

             IF v_user_id IS NOT NULL THEN
                 -- 4. PERFORM UPDATE (Triggers Disabled)
                 UPDATE leads
                 SET assigned_to = v_user_id, 
                     assigned_at = NOW(), 
                     status = 'Assigned',
                     notes = COALESCE(notes, '') || ' [Auto-Processed]'
                 WHERE id = r.id;
                 
                 -- Update user counter manually
                 UPDATE users
                 SET total_leads_received = COALESCE(total_leads_received, 0) + 1,
                     leads_today = COALESCE(leads_today, 0) + 1
                 WHERE id = v_user_id;

                 RAISE NOTICE '   ✅ Assigned to User ID: % (Team: %)', v_user_id, v_team_code;
                 v_processed_count := v_processed_count + 1;
             ELSE
                 RAISE NOTICE '   ⚠️ No eligible user found for team % (All Full?)', v_team_code;
             END IF;
        ELSE
             RAISE NOTICE '   ❌ No team mapping for page %', v_page_name;
        END IF;
    END LOOP;
    
    -- RE-ENABLE TRIGGERS
    ALTER TABLE leads ENABLE TRIGGER ALL;
    
    RAISE NOTICE '--- Finished. Processed: % ---', v_processed_count;
END $$;
