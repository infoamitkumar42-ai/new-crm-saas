-- ============================================================================
-- 📊 CHECK: Who Got Leads from Zero-Lead Users (19 Users)
-- ============================================================================

-- Users who were at 0 and now have leads (from manual distribution)
SELECT 
    name,
    plan_name,
    target_state,
    leads_today,
    email
FROM users 
WHERE is_active = true 
  AND plan_name != 'none'
  AND daily_limit > 0
  AND name IN (
    'Suman', 'Priya Arora', 'Payal', 'Ramandeep Kaur', 'Prabhjot kaur',
    'Sameer', 'PARAMJIT KAUR', 'MUSKAN', 'Himanshu Sharma', 'Kiran Brar',
    'Prabhjeet kaur', 'Vinita punjabi', 'Navpreet kaur', 'SAMAN',
    'Ajay kumar', 'Ravenjeet Kaur', 'Palak', 'Rahul Rai', 'Gurpreet kaur'
  )
ORDER BY leads_today DESC, plan_name, name;
