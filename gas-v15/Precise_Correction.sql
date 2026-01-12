-- ============================================================================
-- PRECISE ASSIGNMENT CORRECTION (PHONE MATCHING)
-- ============================================================================
-- 1. ROLLBACK: Unassign any leads assigned in the last 2 hours for these 3 users.
-- 2. ASSIGN: Use precise PHONE NUMBER matching to assign exactly the 56 leads.
-- ============================================================================

DO $$ 
DECLARE 
    rajwinder_id uuid;
    sunny_id uuid;
    gurnam_id uuid;
BEGIN
    -- 1. Get User IDs (Case Insensitive)
    SELECT id INTO rajwinder_id FROM users WHERE LOWER(email) = LOWER('workwithrajwinder@gmail.com') LIMIT 1;
    SELECT id INTO sunny_id FROM users WHERE LOWER(email) = LOWER('Sunnymehre451@gmail.com') LIMIT 1;
    SELECT id INTO gurnam_id FROM users WHERE LOWER(email) = LOWER('gurnambal01@gmail.com') LIMIT 1;

    -- 2. ROLLBACK RECENT ASSIGNMENTS (Safety Reset)
    -- This clears the "126 leads" or any other wrong assignments from today's session
    IF gurnam_id IS NOT NULL THEN
        UPDATE leads SET user_id = NULL, status = 'New' 
        WHERE user_id = gurnam_id AND assigned_at > NOW() - INTERVAL '2 hours';
    END IF;
    
    IF rajwinder_id IS NOT NULL THEN
        UPDATE leads SET user_id = NULL, status = 'New' 
        WHERE user_id = rajwinder_id AND assigned_at > NOW() - INTERVAL '2 hours';
    END IF;

    IF sunny_id IS NOT NULL THEN
        UPDATE leads SET user_id = NULL, status = 'New' 
        WHERE user_id = sunny_id AND assigned_at > NOW() - INTERVAL '2 hours';
    END IF;

    -- 3. APPLY PRECISE ASSIGNMENTS BY PHONE
    
    -- RAJWINDER (20 Leads)
    IF rajwinder_id IS NOT NULL THEN
        UPDATE leads 
        SET user_id = rajwinder_id, assigned_at = NOW(), status = 'Assigned'
        WHERE phone IN (
            '+918872813360', '+917707814318', '+917355732706', '7087047286', '+917009884043', 
            '+916283332130', '+919056501003', '+917814172101', '+918566038351', '7009854566', 
            '7696360682', '+919876103930', '+918196810842', '+916280394758', '+919501422315', 
            '+919464071764', '+919569445545', '+919988029455', '8437783937', '+917814053302'
        );
    END IF;

    -- SUNNY (18 Leads)
    IF sunny_id IS NOT NULL THEN
        UPDATE leads 
        SET user_id = sunny_id, assigned_at = NOW(), status = 'Assigned'
        WHERE phone IN (
            '+919501044529', '+918303342175', '+917347464482', '+917696897183', '+919914134332', 
            '+919465253879', '+917986801026', '+918284078926', '+919864671000', '+917717312082', 
            '+919877596060', '9517179200', '8872292752', '9915197911', '+919855625579', 
            '6283124138', '+918360057811', '+919142547000'
        );
    END IF;

    -- GURNAM (18 Leads)
    IF gurnam_id IS NOT NULL THEN
        UPDATE leads 
        SET user_id = gurnam_id, assigned_at = NOW(), status = 'Assigned'
        WHERE phone IN (
            '+919041034157', '+917496012917', '+919023158000', '+919463075156', '+919872337203', 
            '+919592491201', '+919646148533', '+919988062709', '+918360293794', '+918360612414', 
            '9988140032', '+917528918261', '+918283043179', '7986009321', '+917837841905', 
            '+919815754215', '7973450053', '6005305564'
        );
    END IF;

END $$;

-- Verify Results
SELECT 
    u.name, 
    COUNT(l.id) as assigned_since_reset,
    MAX(l.created_at) as newest_lead_date,
    MIN(l.created_at) as oldest_lead_date
FROM leads l
JOIN users u ON l.user_id = u.id
WHERE l.assigned_at > NOW() - INTERVAL '5 minutes'
GROUP BY u.name;
