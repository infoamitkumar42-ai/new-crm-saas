-- ============================================================================
-- STEP 2: ASSIGN 14 LEADS — Equal / Balanced Distribution
-- Sabse kam leads wale users ko pehle milenge (Round Robin by fewest first)
-- VERIFY_USER_LEAD_COUNTS.sql pehle run karo confirm karne ke liye
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------
-- CTE 1: Active users — fewest leads_today first
-- ----------------------------------------------------------------
WITH ranked_users AS (
  SELECT
    u.id,
    u.name,
    u.manager_id,
    ROW_NUMBER() OVER (
      ORDER BY COALESCE(u.leads_today, 0) ASC, u.created_at ASC
    ) AS rn
  FROM users u
  WHERE u.is_active = true
    AND u.payment_status = 'active'
    AND u.role = 'member'
),

total_users AS (
  SELECT COUNT(*) AS cnt FROM ranked_users
),

-- ----------------------------------------------------------------
-- CTE 2: Naye 14 leads
-- ----------------------------------------------------------------
new_leads (rn, lead_name, phone, city, category) AS (
  VALUES
    (1,  'Mansi Yadav',        '+916307355251', 'Lucknow',           '18-25'),
    (2,  'Ashwini Upadhyay',   '+919627489560', 'Vrindavan Mathura', '30-40'),
    (3,  'Neeraj Saini',       '+919149206283', 'Moradabad',         '25-30'),
    (4,  'Devendra Kumar',     '+917231852511', 'Churu',             '25-30'),
    (5,  'Bhupender',          '7597715360',    'Bhadra',            '25-30'),
    (6,  'r.............',     '+919012619074', 'Aligarh',           '25-30'),
    (7,  'Naresh',             '+917665366959', 'Naresh Kumar',      '18-25'),
    (8,  'Neeraj Singh',       '+919675215650', 'Delhi',             '30-40'),
    (9,  'Vijesh Kumar',       '+918769747302', 'Sikar',             '25-30'),
    (10, 'Ashish Kumar',       '+919729729191', 'Narnaul',           '30-40'),
    (11, 'Parveen Dogra',      '+917876446194', 'Hamirpur',          '30-40'),
    (12, 'kritika kanera',     '+917678627747', 'New Delhi',         '30-40'),
    (13, 'ANSHUL',             '+916280106141', 'Chandigarh',        '18-25'),
    (14, 'Ankit',              '+918126803068', 'Saharanpur',        '25-30')
),

-- ----------------------------------------------------------------
-- CTE 3: Round-robin assignment — kam wale ko pehle
-- ----------------------------------------------------------------
assignment AS (
  SELECT
    nl.lead_name,
    nl.phone,
    nl.city,
    nl.category,
    ru.id         AS assigned_to,
    ru.name       AS assigned_to_name,
    ru.manager_id
  FROM new_leads nl
  JOIN ranked_users ru
    ON ru.rn = ((nl.rn - 1) % (SELECT cnt FROM total_users)) + 1
)

-- ----------------------------------------------------------------
-- PREVIEW: Pehle dekho kisको kya milega (INSERT se pehle)
-- Jab sahi lage tab neeche wala INSERT uncomment karo
-- ----------------------------------------------------------------
SELECT
  lead_name,
  phone,
  city,
  category,
  assigned_to,
  assigned_to_name
FROM assignment
ORDER BY assigned_to_name, lead_name;

/*
-- ----------------------------------------------------------------
-- ACTUAL INSERT — Uncomment karo jab preview sahi lage
-- ----------------------------------------------------------------

INSERT INTO leads (
  id, name, phone, city, category,
  assigned_to, user_id, manager_id,
  status, source, created_at
)
SELECT
  gen_random_uuid(),
  lead_name,
  phone,
  city,
  category,
  assigned_to,
  assigned_to,     -- user_id = assigned_to (same)
  manager_id,
  'Fresh',
  'manual',
  NOW()
FROM assignment;

-- ----------------------------------------------------------------
-- UPDATE lead counters
-- ----------------------------------------------------------------
UPDATE users u
SET
  leads_today          = leads_today + sub.cnt,
  total_leads_received = total_leads_received + sub.cnt
FROM (
  SELECT assigned_to, COUNT(*) AS cnt
  FROM assignment
  GROUP BY assigned_to
) sub
WHERE u.id = sub.assigned_to;

*/

COMMIT;

-- ----------------------------------------------------------------
-- FINAL VERIFY — Run karo baad mein
-- ----------------------------------------------------------------
SELECT
  u.id,
  u.name,
  u.leads_today,
  COUNT(l.id) AS actual_leads_today
FROM users u
LEFT JOIN leads l
  ON l.assigned_to = u.id
  AND l.created_at >= CURRENT_DATE
WHERE u.is_active = true
  AND u.payment_status = 'active'
  AND u.role = 'member'
GROUP BY u.id, u.name, u.leads_today
ORDER BY actual_leads_today ASC;
