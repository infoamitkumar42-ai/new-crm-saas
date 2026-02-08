
-- ============================================================================
-- 🚀 ACTIVATE CHIRAG TEAM & SETUP PAGE MAPS (READY FOR 8 AM)
-- ============================================================================

DO $$
BEGIN
    -- 1. 🔗 MAP NEW PAGE: 'Digital Chirag' (ID Found from Screenshot)
    -- This ensures leads from this specific Page ID go to GJ01TEAMFIRE
    INSERT INTO meta_pages (page_id, page_name, team_id)
    VALUES ('928347267036761', 'Digital Chirag', 'GJ01TEAMFIRE')
    ON CONFLICT (page_id) DO UPDATE 
    SET team_id = 'GJ01TEAMFIRE', page_name = 'Digital Chirag';

    -- 2. 🔗 MAP BHUMIT PAGE (Double Check)
    INSERT INTO meta_pages (page_id, page_name, team_id)
    VALUES ('61586060581800', 'Bhumit Godhani', 'GJ01TEAMFIRE')
    ON CONFLICT (page_id) DO UPDATE 
    SET team_id = 'GJ01TEAMFIRE';

    -- 3. 🔥 ACTIVATE TEAM 'GJ01TEAMFIRE' (54 Members)
    -- We are reactivating them from the STOP state.
    -- Setting Validity to 30 Days.
    -- restoring Limits to 50 (Standard) or 100 (for old values if higher).
    UPDATE users 
    SET 
        is_active = true,
        is_online = true, -- Auto-Online for morning
        payment_status = 'active',
        valid_until = NOW() + INTERVAL '30 days',
        daily_limit = 50, -- Defaulting everyone to 50 leads/day (Safe Start)
        updated_at = NOW()
    WHERE team_code = 'GJ01TEAMFIRE';

    -- 4. 👑 SPECIFIC MANAGER LIMIT (Chirag)
    UPDATE users 
    SET daily_limit = 100
    WHERE name ILIKE '%Chirag%' AND team_code = 'GJ01TEAMFIRE';

    RAISE NOTICE '✅ SETUP COMPLETE: Pages Linked & Chirag Team Activated!';

END $$;
