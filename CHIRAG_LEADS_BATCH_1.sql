
-- ============================================================================
-- 🚀 MANUAL LEAD DISTRIBUTION (BATCH 1 - First 100 Leads)
-- ============================================================================

BEGIN;

-- 1. UNLOCK TARGET TEAM
UPDATE users 
SET daily_limit = 1000, is_active = true, is_online = true 
WHERE team_code = 'GJ01TEAMFIRE' 
  AND plan_name IN ('starter', 'supervisor', 'manager', 'weekly_boost', 'turbo_boost');

-- 2. DEFINE DATA (First 100 Leads)
WITH new_leads_data (full_name, phone_number, city, source, lead_created_at) AS (
    VALUES
    ('Dharmesh Donda', '9624249683', 'Surat', 'New chirag campaing (ig)', '2026-02-05T18:02:08+05:30'),
    ('Francis Broachwala', '7041846785', 'Vadodara', 'New chirag campaing (ig)', '2026-02-05T17:54:18+05:30'),
    ('Hunter Lion..', '9574490397', 'Rajula', 'New chirag campaing (ig)', '2026-02-05T17:49:25+05:30'),
    ('Vipul Sodha Vipul Sodha', '9265228143', 'Ahmedabad', 'New chirag campaing (ig)', '2026-02-05T16:41:51+05:30'),
    ('Kiran Shah', '8128153498', 'દેહ ગામ', 'New chirag campaing (ig)', '2026-02-05T16:39:28+05:30'),
    ('Juhi Tejas Patel', '9662624788', 'Ahmedabad', 'New chirag campaing (ig)', '2026-02-05T16:07:14+05:30'),
    ('Nitin Patel', '9106009254', 'Patan', 'New chirag campaing (ig)', '2026-02-05T16:01:11+05:30'),
    ('Vadher Hitendrasinh', '9016893200', 'Dwarka', 'New chirag campaing (ig)', '2026-02-05T15:55:50+05:30'),
    ('!!! दरबार अजय सिंह !!!', '9558104758', 'Raner', 'New chirag campaing (ig)', '2026-02-05T15:39:23+05:30'),
    ('Kishan Panchasara', '9016082256', 'Bhavnagar', 'New chirag campaing (ig)', '2026-02-05T15:23:39+05:30'),
    ('Maheta Viral', '9824394303', 'Rajkot', 'New chirag campaing (ig)', '2026-02-05T15:19:07+05:30'),
    ('VICKY ZALA', '9099999820', 'Rajkot', 'New chirag campaing (ig)', '2026-02-05T15:11:25+05:30'),
    ('Jitrajsinh Rajendrasinh Gohil', '9624567454', 'Gariyadhar', 'New chirag campaing (ig)', '2026-02-05T14:29:16+05:30'),
    ('Jignesh  N. Patel', '9173902268', 'Ahmedabad Gujarat', 'New chirag campaing (ig)', '2026-02-05T14:15:25+05:30'),
    ('jay', '8469851562', 'Surat', 'New chirag campaing (ig)', '2026-02-05T14:05:13+05:30'),
    ('Jugal Patel', '9998985933', 'Unjha', 'New chirag campaing (ig)', '2026-02-05T13:34:06+05:30'),
    ('Hi', '8866101683', 'ArifJat', 'New chirag campaing (ig)', '2026-02-05T13:30:44+05:30'),
    ('VB', '8128487117', 'KHEDA', 'New chirag campaing (ig)', '2026-02-05T13:24:26+05:30'),
    ('Jαgdiѕh Gαjjαr', '9879970888', 'Palanpur', 'New chirag campaing (ig)', '2026-02-05T13:19:06+05:30'),
    ('Prince Munnu', '9925668718', 'Bhavanagar', 'New chirag campaing (ig)', '2026-02-05T13:15:18+05:30'),
    ('apps_ king', '7600437507', 'Amadavad', 'New chirag campaing (ig)', '2026-02-05T13:08:41+05:30'),
    ('Prakash Mithpara', '9104552983', 'Surendranagar', 'New chirag campaing (ig)', '2026-02-05T13:05:59+05:30'),
    ('Vishal Raval', '9313564606', 'Kadi', 'New chirag campaing (ig)', '2026-02-05T13:05:47+05:30'),
    ('Vinay Chavda', '9662170855', 'Kutch', 'New chirag campaing (ig)', '2026-02-05T13:05:27+05:30'),
    ('Jigar Ja Ratĥoď', '9328298491', 'Datrai', 'New chirag campaing (ig)', '2026-02-05T13:00:49+05:30'),
    ('Jadeja Pruthavirajsinh', '6355680762', 'Bhuj', 'New chirag campaing (ig)', '2026-02-05T12:54:32+05:30'),
    ('Khushbu', '9724212639', 'Ahmedanad', 'New chirag campaing (ig)', '2026-02-05T12:39:25+05:30'),
    ('Virali shihora', '8401944047', 'Surat', 'New chirag campaing (ig)', '2026-02-05T12:25:57+05:30'),
    ('Vishnu Chaudhari', '8320202488', 'ℂ𝕙𝕒𝕖𝕞𝕓𝕦𝕧𝕒 𝔹𝕙𝕒𝕓𝕙𝕒𝕣 𝔾𝕦𝕛𝕣𝕒𝕥', 'New chirag campaing (ig)', '2026-02-05T12:10:41+05:30'),
    ('Nanda Parmar', '7383526338', 'Vadodara', 'New chirag campaing (ig)', '2026-02-05T12:10:28+05:30'),
    ('RP__', '9727556133', 'Harij', 'New chirag campaing (ig)', '2026-02-05T11:17:47+05:30'),
    ('Pradipsinh Vaghela', '9825028082', 'Ahmedabad', 'New chirag campaing (ig)', '2026-02-05T11:14:04+05:30'),
    ('Aman mali', '9510238889', 'Vadodara', 'New chirag campaing (ig)', '2026-02-05T07:55:34+05:30'),
    ('Piyush Vekariya', '8758161439', 'Surat', 'New chirag campaing (ig)', '2026-02-06T10:29:06+05:30'),
    ('Chetan Barot', '8141032345', 'himatnagar', 'New chirag campaing (fb)', '2026-02-06T10:00:26+05:30'),
    ('Vishal Parmar', '7043153909', 'Ahmadabad', 'New chirag campaing (ig)', '2026-02-06T08:34:56+05:30'),
    ('Vrushangi Dabhi', '7698467419', 'Ahmedabad', 'New chirag campaing (ig)', '2026-02-05T21:47:01+05:30'),
    ('NARESH_D$AI', '9737571442', 'Deesa', 'New chirag campaing (ig)', '2026-02-05T21:44:46+05:30'),
    ('Mukesh Damor', '9726259421', 'Ahamdaband', 'New chirag campaing (ig)', '2026-02-05T21:06:25+05:30'),
    ('H K.  prajapati 143', '8758185046', '360055', 'New chirag campaing (ig)', '2026-02-05T20:15:16+05:30'),
    ('saurin shah', '8928100618', 'Mumbai', 'New chirag campaing (ig)', '2026-02-05T20:02:41+05:30'),
    ('𝚱 𝚱', '8849408951', 'Kevin', 'New chirag campaing (ig)', '2026-02-05T19:49:10+05:30'),
    ('તુષારભાઇ ખંમળ આહિર', '9726595946', 'Sihor', 'New chirag campaing (ig)', '2026-02-05T17:30:19+05:30'),
    ('Kiran', '7069552930', 'Deodar', 'New chirag campaing (ig)', '2026-02-05T16:04:06+05:30'),
    ('Mayur Umavanshi', '9979973848', 'Ahmedabad', 'New chirag campaing (ig)', '2026-02-05T11:16:27+05:30'),
    ('Sarvan Thakur Thakur', '8849550498', 'ભાભર', 'New chirag campaing (ig)', '2026-02-05T11:14:52+05:30'),
    ('Rahul Anand', '9898718745', 'Khambhat', 'New chirag campaing (ig)', '2026-02-05T11:13:50+05:30'),
    ('G.J.BHARWAD', '9979255582', 'Ahmedabad', 'New chirag campaing (ig)', '2026-02-05T11:13:37+05:30'),
    ('Dilip Odedra', '9106603453', 'Porbandar', 'New chirag campaing (fb)', '2026-02-05T15:53:57+05:30'),
    ('Ashok, d, Prajapati,', '9537664531', 'Amadavad', 'New chirag campaing (ig)', '2026-02-05T15:30:51+05:30'),
    ('Minaxiben r Prajapati', '6351287627', 'Nadiya', 'New chirag campaing (ig)', '2026-02-05T15:30:19+05:30'),
    ('Minaxi Mehta', '9377729888', 'Surat', 'New chirag campaing (ig)', '2026-02-05T15:30:07+05:30'),
    ('Soyab Darbar', '9870074595', 'ahemdabad', 'New chirag campaing (ig)', '2026-02-05T13:34:17+05:30'),
    ('Sweta Chauhan', '9601848618', 'Ahmedabad', 'New chirag campaing (ig)', '2026-02-05T13:19:11+05:30'),
    ('Paresh Bhai Kanabar', '9924570956', 'una', 'New chirag campaing (fb)', '2026-02-05T13:16:38+05:30'),
    ('Kevin Ghodasara', '7874790557', 'pikhor', 'New chirag campaing (fb)', '2026-02-05T13:08:38+05:30'),
    ('Rohit Thakor', '8758231553', 'Palanpur', 'New chirag campaing (ig)', '2026-02-05T12:43:11+05:30'),
    ('Virendra Rathva', '7016263651', 'Jetpur Pavi', 'New chirag campaing (ig)', '2026-02-05T12:41:59+05:30'),
    ('DIPAKSINH  ZALA', '8799508253', 'Kalol', 'New chirag campaing (ig)', '2026-02-05T12:39:48+05:30'),
    ('Jay Goga Reference', '9998557161', 'Surat', 'New chirag campaing (fb)', '2026-02-05T12:37:33+05:30'),
    ('Suresh', '9724801248', 'Tharad', 'New chirag campaing (ig)', '2026-02-05T12:36:31+05:30'),
    ('𝓅Ⓡυ𝕊н𝐓ｉ', '6351391918', 'Rajkot', 'New chirag campaing (ig)', '2026-02-05T12:35:57+05:30'),
    ('dipakbhai m.sagar', '7405560500', 'morbi . hadamatiya', 'New chirag campaing (fb)', '2026-02-05T12:32:42+05:30'),
    ('Virat Prajapati', '8799328383', 'Botad', 'New chirag campaing (ig)', '2026-02-05T12:31:56+05:30'),
    ('Raju desai', '9104068662', 'Sabarmati, ahmedabad', 'New chirag campaing (ig)', '2026-02-05T12:30:56+05:30'),
    ('Jaydip Solanki', '9586389185', 'Ahmedabad', 'New chirag campaing (ig)', '2026-02-05T12:25:26+05:30'),
    ('Mehul Parmar', '9265245427', 'Vadodara, Gujarat', 'New chirag campaing (ig)', '2026-02-05T12:11:21+05:30'),
    ('Akash Parmar', '9925759160', 'Baroda', 'New chirag campaing (ig)', '2026-02-05T12:11:15+05:30'),
    ('HK Relax', '7622947663', 'Mahuva', 'New chirag campaing (ig)', '2026-02-05T12:09:26+05:30'),
    ('Keyuri Patel', '9909277458', 'Vadodara', 'New chirag campaing (ig)', '2026-02-05T12:09:25+05:30'),
    ('Roshni Patel', '8866468077', 'Surat', 'New chirag campaing (ig)', '2026-02-05T12:08:20+05:30'),
    ('Nilesh Gusai', '9427818154', 'Bhuj', 'New chirag campaing (ig)', '2026-02-05T07:55:44+05:30'),
    ('Lata Amrutbhai', '9265404759', 'Ahmedabad', 'New chirag campaing (ig)', '2026-02-05T07:54:15+05:30'),
    ('__manish__07', '9316881849', 'Navsari', 'New chirag campaing (ig)', '2026-02-06T10:02:01+05:30'),
    ('Aaditya', '8320796747', 'Jamnagar', 'New chirag campaing (ig)', '2026-02-06T09:57:18+05:30'),
    ('Jiya prajapati', '6359150517', 'Ahemdabad', 'New chirag campaing (ig)', '2026-02-06T08:33:47+05:30'),
    ('Jay Mangwani', '7984115080', 'Godhra', 'New chirag campaing (ig)', '2026-02-06T08:27:12+05:30'),
    ('Narendra  kharadi', '9726053008', 'Meghraj', 'New chirag campaing (ig)', '2026-02-06T08:26:15+05:30'),
    ('RAHULKUMAR SURESHBHAI THAKOR', '9714824207', 'ANAND', 'New chirag campaing (fb)', '2026-02-06T08:26:15+05:30'),
    ('Bhavik Parmar', '7383085888', 'Vadodara', 'New chirag campaing (ig)', '2026-02-06T08:24:57+05:30'),
    ('Mituu', '9327991150', 'Bilimora', 'New chirag campaing (ig)', '2026-02-06T08:21:39+05:30'),
    ('paramar vishnuji natavsrji', '9023299907', 'ડીસા', 'New chirag campaing (ig)', '2026-02-05T21:48:19+05:30'),
    ('Vishal Sen', '9630904879', 'Dahod', 'New chirag campaing (ig)', '2026-02-05T21:34:37+05:30'),
    ('ER Vishal Prajapati', '9106472525', 'Mehsana', 'New chirag campaing (ig)', '2026-02-05T21:29:27+05:30'),
    ('Sindhav Jayshree', '7884450841', 'Rajkot', 'New chirag campaing (ig)', '2026-02-05T21:15:56+05:30'),
    ('Chintan Sinh Dabhi', '8140223241', 'Kadi', 'New chirag campaing (ig)', '2026-02-05T21:10:11+05:30'),
    ('Pathak Sanjay', '9664651562', 'Patan', 'New chirag campaing (ig)', '2026-02-05T20:56:06+05:30'),
    ('Nilesh Bhil', '9316280625', 'Vadodara Alkapuri', 'New chirag campaing (ig)', '2026-02-05T20:53:12+05:30'),
    ('Anvesh Udrala', '9104571837', 'Dahod', 'New chirag campaing (ig)', '2026-02-05T20:39:54+05:30'),
    ('Ashvin Chauhan', '9099427364', 'Melan', 'New chirag campaing (ig)', '2026-02-05T20:24:20+05:30'),
    ('Dhruv Bhavsar', '9265812521', 'Ahemdabad', 'New chirag campaing (ig)', '2026-02-05T20:19:07+05:30'),
    ('Milan Patel', '8401551457', 'Surat', 'New chirag campaing (ig)', '2026-02-05T20:09:45+05:30'),
    ('Suheb Kaji', '9714048074', 'mahUVA', 'New chirag campaing (ig)', '2026-02-05T20:07:43+05:30'),
    ('Anil Parmar', '8320502901', 'Dahod', 'New chirag campaing (ig)', '2026-02-05T20:07:36+05:30'),
    ('Bhavesh Prajapati', '9537382648', 'Palanpur', 'New chirag campaing (ig)', '2026-02-05T20:00:32+05:30'),
    ('Savan Thakor', '6356397695', 'Mehsana', 'New chirag campaing (ig)', '2026-02-05T19:58:33+05:30'),
    ('Paras Mehta', '9409207019', 'Jamngar', 'New chirag campaing (ig)', '2026-02-05T19:54:46+05:30'),
    ('Rashmikant Parekh', '9825195037', 'Mahemdavad', 'New chirag campaing (fb)', '2026-02-05T19:52:53+05:30'),
    ('Sarvaiya Arjunsinh', '7069635485', 'Mahuva', 'New chirag campaing (ig)', '2026-02-05T19:50:58+05:30'),
    ('Riddhil   lathia', '9819051025', 'અમદાવાદ', 'New chirag campaing (ig)', '2026-02-05T19:50:26+05:30'),
    ('Mahes Limbdiya', '7990976592', 'Rajkot', 'New chirag campaing (ig)', '2026-02-05T19:46:56+05:30')
),
active_team AS (
    SELECT id 
    FROM users
    WHERE team_code = 'GJ01TEAMFIRE' 
      AND is_active = true 
      AND plan_name IN ('starter', 'supervisor', 'manager', 'weekly_boost', 'turbo_boost')
    ORDER BY id
),
team_stats AS (
    SELECT count(*) as total FROM active_team
),
numbered_leads AS (
    SELECT 
        nld.*, 
        ROW_NUMBER() OVER (ORDER BY nld.lead_created_at) as r_num
    FROM new_leads_data nld
    WHERE NOT EXISTS (
        SELECT 1 FROM leads l WHERE l.phone_number = nld.phone_number
    )
),
assignments AS (
    SELECT 
        nl.*,
        at.id as assigned_user_id
    FROM numbered_leads nl
    CROSS JOIN team_stats ts
    JOIN active_team at ON at.id = (
        SELECT id FROM active_team 
        OFFSET (nl.r_num - 1) % CASE WHEN ts.total = 0 THEN 1 ELSE ts.total END LIMIT 1
    )
),
insert_ops AS (
    INSERT INTO leads (full_name, phone_number, city, source, status, assigned_to, created_at)
    SELECT 
        full_name, 
        phone_number, 
        city, 
        source, 
        'Assigned', 
        assigned_user_id, 
        lead_created_at::timestamptz
    FROM assignments
    ON CONFLICT (phone_number) 
    DO UPDATE SET 
        status = 'Assigned',
        assigned_to = EXCLUDED.assigned_to,
        assigned_at = NOW()
    RETURNING id, full_name, assigned_to
)
-- 3. NOTIFY USERS
INSERT INTO notifications (user_id, title, message, type, created_at)
SELECT 
    assigned_to, 
    'New Lead Assigned', 
    'Manual Assignment: ' || full_name, 
    'lead_assignment', 
    NOW()
FROM insert_ops;

COMMIT;

-- 4. VERIFY (Matches ANY created date since Feb 5)
SELECT count(*) as leads_distributed_batch_1 
FROM leads 
WHERE created_at >= '2026-02-05' 
AND source LIKE 'New chirag%';
