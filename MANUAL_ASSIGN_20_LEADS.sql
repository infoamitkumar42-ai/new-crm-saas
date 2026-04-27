-- ============================================================
-- MANUAL LEAD ASSIGNMENT — 20 Leads to 4 Users
-- Date: 2026-04-06
-- Run in: Supabase SQL Editor (vewqzsqddgmkslnuctvb)
-- ============================================================

-- STEP 1: Check today's distribution BEFORE (run this first, separately)
SELECT
  u.email,
  u.leads_today,
  u.total_leads_received,
  u.total_leads_promised,
  (u.total_leads_promised - u.total_leads_received) AS remaining
FROM users u
WHERE u.email IN (
  'prachigarg@flp.com',
  'ravenjeetkaur@gmail.com',
  'aansh8588@gmail.com',
  'sharmahimanshu9797@gmail.com'
);

-- ============================================================
-- STEP 2: INSERT 20 LEADS
-- (Run this block as one transaction)
-- ============================================================

BEGIN;

-- ── prachigarg@flp.com (4 leads) ─────────────────────────────
INSERT INTO leads (id, name, phone, city, status, assigned_to, assigned_at, created_at)
VALUES
  (gen_random_uuid(), 'Nitesh Khatana',   '917404488085', 'Karnal',    'Assigned', 'f87f7aca-3a41-4056-a41e-5c923cffab8b', NOW(), NOW()),
  (gen_random_uuid(), 'Narayan Khatana',  '918512005545', 'Faridabad', 'Assigned', 'f87f7aca-3a41-4056-a41e-5c923cffab8b', NOW(), NOW()),
  (gen_random_uuid(), 'Rohan Raj',        '919999227151', 'Gurugram',  'Assigned', 'f87f7aca-3a41-4056-a41e-5c923cffab8b', NOW(), NOW()),
  (gen_random_uuid(), 'Ankita Srivastava','917500342520', 'Haldwani',  'Assigned', 'f87f7aca-3a41-4056-a41e-5c923cffab8b', NOW(), NOW());

-- ── ravenjeetkaur@gmail.com (5 leads) ────────────────────────
INSERT INTO leads (id, name, phone, city, status, assigned_to, assigned_at, created_at)
VALUES
  (gen_random_uuid(), 'Khushleen Bath',    '919690190319', 'Pilibhit',  'Assigned', 'b7d48ac0-7bb3-428b-b982-ed206243127f', NOW(), NOW()),
  (gen_random_uuid(), 'Parveen Rajput',    '917876628160', 'Padhar',    'Assigned', 'b7d48ac0-7bb3-428b-b982-ed206243127f', NOW(), NOW()),
  (gen_random_uuid(), 'xpreet_man',        '919672610723', 'Rajasthan', 'Assigned', 'b7d48ac0-7bb3-428b-b982-ed206243127f', NOW(), NOW()),
  (gen_random_uuid(), 'Harveen Kaur Brar', '919646412108', 'Chandigarh','Assigned', 'b7d48ac0-7bb3-428b-b982-ed206243127f', NOW(), NOW()),
  (gen_random_uuid(), 'Hema',              '919803273333', 'Jalandhar', 'Assigned', 'b7d48ac0-7bb3-428b-b982-ed206243127f', NOW(), NOW());

-- ── aansh8588@gmail.com (3 leads) ────────────────────────────
INSERT INTO leads (id, name, phone, city, status, assigned_to, assigned_at, created_at)
VALUES
  (gen_random_uuid(), 'Shivam',              '918409397877', 'Dehradun', 'Assigned', '989af3e2-aa9e-4b30-ad5d-d8194c053a5f', NOW(), NOW()),
  (gen_random_uuid(), 'Neelam Jaglan Nain',  '918295888033', 'Sikar',    'Assigned', '989af3e2-aa9e-4b30-ad5d-d8194c053a5f', NOW(), NOW()),
  (gen_random_uuid(), 'Shivani Chaudhary',   '918894455446', 'Mandi',    'Assigned', '989af3e2-aa9e-4b30-ad5d-d8194c053a5f', NOW(), NOW());

-- ── sharmahimanshu9797@gmail.com (8 leads) ───────────────────
INSERT INTO leads (id, name, phone, city, status, assigned_to, assigned_at, created_at)
VALUES
  (gen_random_uuid(), 'Vikas Kumar',      '919058485354', 'Yamunanagar', 'Assigned', '9dd68ace-a5a7-46d8-b677-3483b5bb0841', NOW(), NOW()),
  (gen_random_uuid(), 'Subhash King',     '919821464909', 'Lucknow',     'Assigned', '9dd68ace-a5a7-46d8-b677-3483b5bb0841', NOW(), NOW()),
  (gen_random_uuid(), 'Prince Sharma',    '917973710894', 'Himachal',    'Assigned', '9dd68ace-a5a7-46d8-b677-3483b5bb0841', NOW(), NOW()),
  (gen_random_uuid(), 'Deepesh Chand',    '919756005360', 'Khatima',     'Assigned', '9dd68ace-a5a7-46d8-b677-3483b5bb0841', NOW(), NOW()),
  (gen_random_uuid(), 'Arvind',           '918273020746', 'Haridwar',    'Assigned', '9dd68ace-a5a7-46d8-b677-3483b5bb0841', NOW(), NOW()),
  (gen_random_uuid(), 'Priyank Bajpayee', '919258904451', 'Surat',       'Assigned', '9dd68ace-a5a7-46d8-b677-3483b5bb0841', NOW(), NOW()),
  (gen_random_uuid(), 'Shalu Bhardwaj',   '919818442244', 'Faridabad',   'Assigned', '9dd68ace-a5a7-46d8-b677-3483b5bb0841', NOW(), NOW()),
  (gen_random_uuid(), 'Rohit Chouhan',    '919815143531', 'Amritsar',    'Assigned', '9dd68ace-a5a7-46d8-b677-3483b5bb0841', NOW(), NOW());

-- ============================================================
-- STEP 3: UPDATE COUNTERS
-- ============================================================

-- prachigarg +4
UPDATE users
SET leads_today = leads_today + 4,
    total_leads_received = total_leads_received + 4
WHERE id = 'f87f7aca-3a41-4056-a41e-5c923cffab8b';

-- ravenjeetkaur +5
UPDATE users
SET leads_today = leads_today + 5,
    total_leads_received = total_leads_received + 5
WHERE id = 'b7d48ac0-7bb3-428b-b982-ed206243127f';

-- aansh8588 +3
UPDATE users
SET leads_today = leads_today + 3,
    total_leads_received = total_leads_received + 3
WHERE id = '989af3e2-aa9e-4b30-ad5d-d8194c053a5f';

-- sharmahimanshu +8
UPDATE users
SET leads_today = leads_today + 8,
    total_leads_received = total_leads_received + 8
WHERE id = '9dd68ace-a5a7-46d8-b677-3483b5bb0841';

COMMIT;

-- ============================================================
-- STEP 4: VERIFY — run after commit
-- ============================================================

SELECT
  u.email,
  u.leads_today,
  u.total_leads_received,
  u.total_leads_promised,
  (u.total_leads_promised - u.total_leads_received) AS remaining,
  COUNT(l.id) AS leads_assigned_today
FROM users u
LEFT JOIN leads l
  ON l.assigned_to = u.id
  AND l.assigned_at >= (NOW() AT TIME ZONE 'UTC')::date
WHERE u.email IN (
  'prachigarg@flp.com',
  'ravenjeetkaur@gmail.com',
  'aansh8588@gmail.com',
  'sharmahimanshu9797@gmail.com'
)
GROUP BY u.email, u.leads_today, u.total_leads_received, u.total_leads_promised;

-- ============================================================
-- STEP 5: Today's total distribution (all users, midnight IST)
-- ============================================================

SELECT
  COUNT(*) AS total_leads_today
FROM leads
WHERE assigned_at >= (CURRENT_DATE AT TIME ZONE 'Asia/Kolkata')::timestamptz;
