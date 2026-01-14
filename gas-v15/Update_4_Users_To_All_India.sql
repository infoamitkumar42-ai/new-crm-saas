-- ============================================================================
-- 🔧 UPDATE: Set 4 Users to "All India" for Lead Eligibility
-- ============================================================================

UPDATE users 
SET target_state = 'All India'
WHERE email IN (
    -- Ramandeep Kaur (Gujarat -> All India)
    (SELECT email FROM users WHERE name = 'Ramandeep Kaur' AND plan_name = 'supervisor'),
    -- Gurpreet kaur (Rajasthan -> All India)
    (SELECT email FROM users WHERE name = 'Gurpreet kaur' AND plan_name = 'weekly_boost'),
    -- Kiran Brar (Gujarat -> All India)
    (SELECT email FROM users WHERE name = 'Kiran Brar' AND plan_name = 'weekly_boost'),
    -- Prabhjeet kaur (Gujarat -> All India)
    (SELECT email FROM users WHERE name = 'Prabhjeet kaur' AND plan_name = 'weekly_boost')
);

-- Simpler Update (Direct by Name + Plan)
UPDATE users SET target_state = 'All India' 
WHERE name = 'Ramandeep Kaur' AND plan_name = 'supervisor';

UPDATE users SET target_state = 'All India' 
WHERE name = 'Gurpreet kaur' AND plan_name = 'weekly_boost';

UPDATE users SET target_state = 'All India' 
WHERE name = 'Kiran Brar' AND plan_name = 'weekly_boost';

UPDATE users SET target_state = 'All India' 
WHERE name = 'Prabhjeet kaur' AND plan_name = 'weekly_boost';

-- Verify the Update
SELECT name, plan_name, leads_today, target_state 
FROM users 
WHERE name IN ('Ramandeep Kaur', 'Gurpreet kaur', 'Kiran Brar', 'Prabhjeet kaur');
