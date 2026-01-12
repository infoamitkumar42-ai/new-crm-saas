-- ============================================================================
-- MANUAL ASSIGNMENT (SMART MATCH): 17 SPECIAL LEADS TO SUNNY
-- ============================================================================
-- Fixes matching issues by cleaning DB phones (+91, spaces) before comparing.

DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- 1. Get Sunny's User ID
    SELECT id INTO target_user_id FROM users WHERE LOWER(email) = 'sunnymehre451@gmail.com' LIMIT 1;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User sunnymehre451@gmail.com not found!';
    END IF;

    -- 2. Create temp table with cleaned 10-digit numbers
    CREATE TEMP TABLE temp_priority_leads (
        created_at TIMESTAMPTZ,
        name TEXT,
        clean_phone TEXT,
        city TEXT
    );

    INSERT INTO temp_priority_leads (created_at, name, clean_phone, city) VALUES 
    ('2026-01-09T02:50:53-05:00', 'Gurjeet Jugait', '9914427059', 'Chandigarh'),
    ('2026-01-09T02:56:18-05:00', 'ਗੂਰਵਿੰਦਰ ਸਿੰਘ ਕੰਗ', '7696115849', 'Mohali'),
    ('2026-01-09T03:07:36-05:00', 'Dilwinder singh', '9914294312', 'Mohali'),
    ('2026-01-09T03:14:05-05:00', 'Monty Saini', '8628851346', 'Nalagarh'),
    ('2026-01-09T03:28:19-05:00', 'Maneeesh', '8968105171', 'Hoshiarpur'),
    ('2026-01-09T03:33:03-05:00', 'Rajdeep', '8427268934', 'Samrala'),
    ('2026-01-09T03:40:14-05:00', 'Lakhvir kaur', '7973912722', 'Samrala'),
    ('2026-01-09T06:42:38-05:00', 'Mandeep Singh', '7508497594', 'Khanna'),
    ('2026-01-09T06:47:12-05:00', 'Itz Hero', '6283456859', 'Rupnagar'),
    ('2026-01-09T07:04:38-05:00', 'Gurpreet Singh', '8968902285', 'Machhiwara sahib'),
    ('2026-01-09T07:06:07-05:00', 'Simar Sapna Arora', '7341155565', 'Ludhiana'),
    ('2026-01-09T07:06:58-05:00', 'Gautam bawa', '9876391906', 'Ludhiana'),
    ('2026-01-09T07:14:48-05:00', 'Seerat', '6283111560', 'Patiala'),
    ('2026-01-09T07:30:08-05:00', 'sania sonu', '9815531324', 'Hoshiyaar Pur'),
    ('2026-01-09T07:35:46-05:00', 'Inder R', '8725810450', 'Doraha'),
    ('2026-01-09T07:50:13-05:00', 'Pankaj Ch', '8699216649', 'Ludhiana'),
    ('2026-01-09T08:17:24-05:00', 'Harman', '7814023117', 'Punjab');

    -- 3. SMART UPDATE: Clean DB phone number ON THE FLY for matching
    -- Removes '+', '91', 'p:', and any non-digits to get the core 10 digits
    UPDATE leads l
    SET 
        user_id = target_user_id,
        status = 'Assigned',
        assigned_at = NOW(),
        name = t.name,
        city = t.city
    FROM temp_priority_leads t
    WHERE RIGHT(REGEXP_REPLACE(l.phone, '\D', '', 'g'), 10) = t.clean_phone;

    -- 4. INSERT AS NEW: If the cleaned phone doesn't exist at all
    INSERT INTO leads (created_at, name, phone, city, user_id, status, assigned_at, source)
    SELECT t.created_at, t.name, t.clean_phone, t.city, target_user_id, 'Assigned', NOW(), 'Manual Import'
    FROM temp_priority_leads t
    WHERE NOT EXISTS (
        SELECT 1 FROM leads l2 
        WHERE RIGHT(REGEXP_REPLACE(l2.phone, '\D', '', 'g'), 10) = t.clean_phone
    );

    -- 5. Sync Sunny's counter
    UPDATE users 
    SET leads_today = (SELECT COUNT(*) FROM leads WHERE user_id = target_user_id AND assigned_at >= CURRENT_DATE)
    WHERE id = target_user_id;

    RAISE NOTICE 'Smart Assignment Complete for Sunny.';
    DROP TABLE temp_priority_leads;
END $$;

-- 6. VERIFY: Show only the leads assigned to Sunny TODAY
SELECT name, phone, status, assigned_at 
FROM leads 
WHERE user_id = (SELECT id FROM users WHERE email = 'sunnymehre451@gmail.com')
  AND assigned_at >= CURRENT_DATE
ORDER BY assigned_at DESC;
