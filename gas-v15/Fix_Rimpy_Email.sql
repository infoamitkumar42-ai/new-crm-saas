-- ============================================================================
-- 🔧 FIX USER EMAIL TYPO (chouhansab64@gmail.ckm -> .com)
-- ============================================================================

DO $$
DECLARE
    v_bad_email TEXT := 'chouhansab64@gmail.ckm';
    v_good_email TEXT := 'chouhansab64@gmail.com';
    v_bad_id UUID;
    v_good_id UUID;
BEGIN
    -- 1. Find IDs
    SELECT id INTO v_bad_id FROM users WHERE email = v_bad_email;
    SELECT id INTO v_good_id FROM users WHERE email = v_good_email;

    -- 2. Scenario A: Bad email exists, Good email DOES NOT exist. (Simple Rename)
    IF v_bad_id IS NOT NULL AND v_good_id IS NULL THEN
        UPDATE users 
        SET email = v_good_email,
            updated_at = NOW()
        WHERE id = v_bad_id;
        
        RAISE NOTICE '✅ Fixed Typo: Renamed user % to %', v_bad_email, v_good_email;

    -- 3. Scenario B: BOTH exist. (Merge/Transfer)
    ELSIF v_bad_id IS NOT NULL AND v_good_id IS NOT NULL THEN
        -- Move Leads
        UPDATE leads 
        SET user_id = v_good_id 
        WHERE user_id = v_bad_id;
        
        -- Move Subscription/Payments (If table exists)
        -- (Assuming simple structure for now, focusing on leads)
        
        -- Update counters for Good User
        UPDATE users u
        SET total_leads_received = total_leads_received + (SELECT leads_today FROM users WHERE id = v_bad_id), -- Approximate logic
            leads_today = leads_today + (SELECT leads_today FROM users WHERE id = v_bad_id)
        WHERE id = v_good_id;

        -- Deactivate Bad User
        UPDATE users 
        SET is_active = false, 
            daily_limit = 0,
            plan_name = 'archived'
        WHERE id = v_bad_id;

        RAISE NOTICE '✅ Merged Accounts: Transferred leads from % to %', v_bad_email, v_good_email;

    -- 4. Scenario C: Bad email not found
    ELSIF v_bad_id IS NULL AND v_good_id IS NOT NULL THEN
         RAISE NOTICE 'ℹ️ Good email already exists. Bad email not found. Nothing to do.';
         
    ELSE
         RAISE NOTICE '⚠️ User not found with either % or %', v_bad_email, v_good_email;
    END IF;

END $$;

-- Validation
SELECT id, name, email, leads_today, total_leads_received, is_active
FROM users 
WHERE email LIKE 'chouhansab64%';
