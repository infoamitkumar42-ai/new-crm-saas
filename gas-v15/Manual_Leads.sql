-- ============================================================================
-- MANUAL LEAD IMPORT & ASSIGNMENT (FINAL)
-- ============================================================================
-- 1. Insert 56 Leads (Cleaned: No 'last_source', Phone numbers fixed)
-- 2. Assigns: 20 -> Rajwinder, 18 -> Sunny, 18 -> Gurnam (as requested)
-- ============================================================================

-- 1. Insert Data
INSERT INTO leads (created_at, name, phone, city, status)
VALUES
('2026-01-08T10:39:50-05:00', 'ਸਰਪੰਚ ਘੌੜੀ ਵਾਲਾ', '+918872813360', 'Ludhiana', 'New'),
('2026-01-08T10:41:04-05:00', 'Karan Bhatti', '+917707814318', '152022', 'New'),
('2026-01-08T10:41:51-05:00', 'Deep Chahal', '+917355732706', 'Patiala', 'New'),
('2026-01-08T10:43:53-05:00', 'Parm Nagra', '7087047286', 'Sirhind', 'New'),
('2026-01-08T10:44:44-05:00', 'sᴜᴋʜᴍᴀɴ', '+917009884043', 'Dhuri', 'New'),
('2026-01-08T10:45:46-05:00', 'Gurjant Sandhu', '+916283332130', 'Guru Har Sahai', 'New'),
('2026-01-08T10:47:07-05:00', 'jagdeep singh', '+919056501003', 'Bathinda', 'New'),
('2026-01-08T10:47:25-05:00', 'Surinder kaur', '+917814172101', 'Ferozepur', 'New'),
('2026-01-08T10:48:42-05:00', 'gurjinder singh', '+918566038351', 'Ludhiana', 'New'),
('2026-01-08T10:48:45-05:00', '༒♛𝔄𝔪𝔞𝔫𝔡𝔢𝔢𝔭 𝔎𝔞𝔲𝔯 ♛༒꧂', '7009854566', 'Patti', 'New'),
('2026-01-08T10:51:30-05:00', 'Ammy Rakhra', '7696360682', 'Patiala', 'New'),
('2026-01-08T10:52:35-05:00', 'AmNa', '+919876103930', 'Punjab', 'New'),
('2026-01-08T10:53:26-05:00', 'Harkaran Nahal', '+918196810842', 'Jalandhar', 'New'),
('2026-01-08T10:53:50-05:00', 'shallu', '+916280394758', 'Bathinda', 'New'),
('2026-01-08T10:54:07-05:00', 'RajEev kumar', '+919501422315', 'Ludhiana', 'New'),
('2026-01-08T10:56:31-05:00', 'Ajaypreet singh', '+919464071764', 'Bassi pathana', 'New'),
('2026-01-08T10:56:50-05:00', 'Šẫňȡễễƿ Ƿuři	', '+919569445545', 'moga', 'New'),
('2026-01-08T10:59:12-05:00', 'Lovebeer Gill', '+919988029455', 'sabhra', 'New'),
('2026-01-08T11:01:18-05:00', 'preet Dhanda0002', '8437783937', 'Samrala', 'New'),
('2026-01-08T11:01:27-05:00', 'Parvinder singh', '+917814053302', 'Romana albel Singh', 'New'),
('2026-01-08T11:03:19-05:00', 'Harpreet Sekhon', '+919501044529', 'Khamanon', 'New'),
('2026-01-08T11:03:26-05:00', 'Manbir Singh Sekhon', '+918303342175', 'Shahjahanpur', 'New'),
('2026-01-08T11:03:34-05:00', 'Jasbirsigh Sidhu', '+917347464482', 'Punjab', 'New'),
('2026-01-08T11:14:20-05:00', 'Amrita', '+917696897183', 'Ferozepur Punjab', 'New'),
('2026-01-08T11:18:40-05:00', 'Simranpreet Singh', '+919914134332', 'Moga', 'New'),
('2026-01-08T11:48:59-05:00', 'Samdream Khus', '+919465253879', 'Fazilka', 'New'),
('2026-01-08T11:51:44-05:00', 'sarbjit81463', '+917986801026', 'Kotfutti', 'New'),
('2026-01-08T15:09:09-05:00', 'Kulwant Singh', '+918284078926', 'Rupnagar', 'New'),
('2026-01-08T15:27:31-05:00', 'Honey Maankya', '+919864671000', 'Sangurur', 'New'),
('2026-01-08T16:14:50-05:00', 'Rohit kumar', '+917717312082', 'Khanna', 'New'),
('2026-01-08T16:58:46-05:00', 'Tajinder Gahanoliya', '+919877596060', 'Amritsar', 'New'),
('2026-01-08T18:05:25-05:00', 'Karam Bhinðer', '9517179200', 'Patran, patiala', 'New'),
('2026-01-08T19:09:28-05:00', 'Sandeep kaur', '8872292752', 'Landra', 'New'),
('2026-01-08T19:09:44-05:00', 'Mehak garg', '9915197911', 'Bhikhi', 'New'),
('2026-01-08T19:10:05-05:00', 'Gurdeep Singh Deepy', '+919855625579', 'Sunam', 'New'),
('2026-01-08T19:37:20-05:00', 'Laddi,,,307', '6283124138', 'Laddi sangrur', 'New'),
('2026-01-08T20:24:41-05:00', 'Akashdeep Singh', '+918360057811', 'Chandigarh', 'New'),
('2026-01-08T20:45:17-05:00', 'Gurjinder Landhey', '+919142547000', 'Sunam', 'New'),
('2026-01-08T20:52:29-05:00', 'Harwinder Gill', '+919041034157', 'khanna', 'New'),
('2026-01-08T21:01:13-05:00', 'ਪੰਜਾਬ', '+917496012917', 'Ratia', 'New'),
('2026-01-08T21:04:59-05:00', 'Guri Gill', '+919023158000', 'Moonak', 'New'),
('2026-01-08T21:08:54-05:00', 'Mandeep sandhu', '+919463075156', 'Longowal', 'New'),
('2026-01-08T21:11:25-05:00', 'Gurdeep Bhaganpuria', '+919872337203', 'Sirhind', 'New'),
('2026-01-08T21:12:22-05:00', 'surmukh Singh', '+919592491201', 'kharar', 'New'),
('2026-01-08T21:48:09-05:00', 'Rohit Gill', '+919646148533', 'Muktsar', 'New'),
('2026-01-08T21:55:45-05:00', 'Manjeet Brar', '+919988062709', 'Muktsar', 'New'),
('2026-01-08T22:06:34-05:00', 'Amanpreet Singh', '+918360293794', 'Bathinda', 'New'),
('2026-01-08T22:40:06-05:00', 'Barinder Singh', '+918360612414', 'Chamkaur Sahib', 'New'),
('2026-01-08T22:43:14-05:00', 'Gurkamal singh', '9988140032', 'Dhuri', 'New'),
('2026-01-08T22:43:39-05:00', 'Sharma Prince', '+917528918261', 'Muktsar', 'New'),
('2026-01-08T22:48:00-05:00', 'preetkaur', '+918283043179', 'Khamano', 'New'),
('2026-01-08T23:03:51-05:00', 'Prince Chhabra', '7986009321', 'Rajpura', 'New'),
('2026-01-08T23:09:16-05:00', 'Akashdeepsingh', '+917837841905', 'Tarn Taran punjab', 'New'),
('2026-01-08T23:22:37-05:00', 'Simar', '+919815754215', 'Moga', 'New'),
('2026-01-08T23:44:52-05:00', 'Manpreet', '7973450053', 'Beer kalan', 'New'),
('2026-01-09T00:02:59-05:00', '꧁♛GྂoⓤⓡaVྂ♛꧂', '6005305564', 'Batala', 'New');

-- 2. Clean up Phone Numbers (remove 'p:')
UPDATE leads 
SET phone = REPLACE(phone, 'p:', '') 
WHERE phone LIKE 'p:%';

-- 3. ASSIGN LEADS (Requested Logic)
DO $$ 
DECLARE 
    rajwinder_id uuid;
    sunny_id uuid;
    gurnam_id uuid;
BEGIN
    -- Get User IDs
    SELECT id INTO rajwinder_id FROM users WHERE email = 'workwithrajwinder@gmail.com' LIMIT 1;
    SELECT id INTO sunny_id FROM users WHERE email = 'Sunnymehre451@gmail.com' LIMIT 1;
    SELECT id INTO gurnam_id FROM users WHERE email = 'gurnambal01@gmail.com' LIMIT 1;

    -- 1. Assign First 20 to Rajwinder
    IF rajwinder_id IS NOT NULL THEN
        UPDATE leads 
        SET user_id = rajwinder_id, assigned_at = NOW(), status = 'Assigned'
        WHERE id IN (
            SELECT id FROM leads 
            WHERE user_id IS NULL AND status = 'New'
            ORDER BY created_at ASC 
            LIMIT 20
        );
    END IF;

    -- 2. Assign Next 18 to Sunny
    IF sunny_id IS NOT NULL THEN
        UPDATE leads 
        SET user_id = sunny_id, assigned_at = NOW(), status = 'Assigned'
        WHERE id IN (
            SELECT id FROM leads 
            WHERE user_id IS NULL AND status = 'New'
            ORDER BY created_at ASC 
            LIMIT 18
        );
    END IF;

    -- 3. Assign Remaining (approx 18) to Gurnam
    IF gurnam_id IS NOT NULL THEN
        UPDATE leads 
        SET user_id = gurnam_id, assigned_at = NOW(), status = 'Assigned'
        WHERE id IN (
            SELECT id FROM leads 
            WHERE user_id IS NULL AND status = 'New'
            ORDER BY created_at ASC 
            -- No limit, takes all remaining
        );
    END IF;
END $$;
