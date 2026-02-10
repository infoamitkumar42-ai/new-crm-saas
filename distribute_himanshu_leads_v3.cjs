const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const leadsData = [
    ['2026-02-10T12:02:36+05:30', 'Janvi', '6239374075', 'ig', 'Fridkot'],
    ['2026-02-10T11:23:11+05:30', 'Sonu sahoo', '+919341149421', 'ig', 'Br'],
    ['2026-02-10T09:34:22+05:30', 'KUMAIL ALY', '+917006364248', 'ig', 'Budgam'],
    ['2026-02-10T09:16:37+05:30', 'Deepakk Kumar', '+919878868070', 'ig', 'Panchkula'],
    ['2026-02-10T09:15:39+05:30', 'Vanshu', '9103162419', 'ig', 'Jammu'],
    ['2026-02-10T09:09:59+05:30', 'Suraj kumary', '+917542057320', 'ig', 'Wait a minute, I\'ll be right back.'],
    ['2026-02-10T08:52:16+05:30', 'Muslim___girll___19', '+918082616588', 'ig', 'Bandipora'],
    ['2026-02-10T12:20:56+05:30', 'Eshikapal', '7658079512', 'ig', 'Punjab'],
    ['2026-02-10T12:13:35+05:30', 'Parikshit Panwar', '+919286845383', 'ig', 'New York'],
    ['2026-02-10T12:12:38+05:30', 'Anita Nayok', '+919957324936', 'fb', 'Sibsagar'],
    ['2026-02-10T12:04:43+05:30', 'Chesong', '+917002358346', 'ig', 'Diphu'],
    ['2026-02-10T12:00:41+05:30', 'ਆਦਿਤਯ ਸੈਨੀ', '9991156326', 'ig', 'Kurukshetra'],
    ['2026-02-10T11:49:10+05:30', 'Ritika kumari', '9334503020', 'ig', 'Jharkhand'],
    ['2026-02-10T11:43:08+05:30', 'Vihan', '9719133777', 'ig', 'Haridwar'],
    ['2026-02-10T11:39:45+05:30', 'Rdx_-_·danial★₹09', '+916003977210', 'ig', 'Aggadv'],
    ['2026-02-10T11:24:26+05:30', 'Muskan', '+919107866690', 'ig', 'bhellasa'],
    ['2026-02-10T11:15:32+05:30', 'F.H FARHAD HUSSAIN 999', '8876767427', 'ig', 'Asdfghjkl'],
    ['2026-02-10T11:12:00+05:30', 'Pappu Thakur', '+919153268113', 'fb', 'Rohtas'],
    ['2026-02-10T10:48:08+05:30', 'ـﮩﮩـ╬━❥❥═══(V_A_N_E_E_T)', '+918492939157', 'ig', 'Udhampur'],
    ['2026-02-10T10:39:37+05:30', 'unknown boy', '+918811814157', 'ig', 'Kheroni'],
    ['2026-02-10T10:19:07+05:30', 'itz_zeeshan_hayat_075', '8407847510', 'ig', 'Sitamarhi'],
    ['2026-02-10T10:14:15+05:30', 'यदुवंशी', '+919027847884', 'ig', 'Etah'],
    ['2026-02-10T10:13:39+05:30', '..... PATEL.....', '9541269271', 'ig', 'Tudra'],
    ['2026-02-10T10:04:19+05:30', 'Aarav_Anand', '+918002162412', 'ig', 'Muzaffarpur'],
    ['2026-02-10T09:59:34+05:30', 'Nikki', '+919368847959', 'ig', 'Up'],
    ['2026-02-10T09:47:33+05:30', 'Armanali', '+917988665396', 'ig', 'Fp jhirka'],
    ['2026-02-10T09:25:31+05:30', 'Raju Hembrom', '+919334872368', 'ig', 'Jamshedpur'],
    ['2026-02-10T09:07:37+05:30', '★simar_dhxllon★', '8264736825', 'ig', 'Chandigarh'],
    ['2026-02-10T09:02:40+05:30', '_jigar_.', '+917903718895', 'ig', 'Ranchi'],
    ['2026-02-10T09:01:21+05:30', 'garvit thakral...', '+919817258560', 'ig', 'Hansi'],
    ['2026-02-10T08:52:16+05:30', 'Harshit Rao', '+919306657742', 'ig', 'Farrukhnagar'],
    ['2026-02-10T08:49:43+05:30', 'Aditya Sahu', '+916267652695', 'ig', 'Saraipali'],
    ['2026-02-10T08:46:17+05:30', 'Mohit Shrama', '+919466638094', 'ig', 'Hisar'],
    ['2026-02-10T08:34:52+05:30', 'Mohit', '6239594770', 'ig', 'Up'],
    ['2026-02-10T08:34:39+05:30', 'Aditya Singh', '9816117596', 'ig', 'Kasauli'],
    ['2026-02-10T08:31:00+05:30', 'A M R I T', '8797081394', 'ig', 'Gumla'],
    ['2026-02-10T08:26:01+05:30', 'Khushi Ram', '9499256260', 'ig', 'Jind'],
    ['2026-02-10T08:00:27+05:30', 'bhumihar jii(◍•ᴗ•◍)(◍•ᴗ•◍)╣[-_-]╠', '+917838850827', 'ig', 'Bihar'],
    ['2026-02-10T07:54:34+05:30', 'Shadow jain', '+917634844125', 'ig', 'Samastipur bihar'],
    ['2026-02-10T07:46:01+05:30', 'Nitin Rao Ghadge', '+917067955660', 'ig', 'Bilaspur'],
    ['2026-02-10T07:38:28+05:30', 'Lakshmi Kumari', '+919153031966', 'ig', 'Lakhisarai'],
    ['2026-02-10T07:34:04+05:30', '꧁⫷Tushar⫸꧂', '+9012736994', 'ig', 'Haldwani'],
    ['2026-02-10T07:32:00+05:30', 'sanjana bisht', '+917983670918', 'ig', 'Uttarakhand'],
    ['2026-02-10T07:11:03+05:30', 'Prishi', '+919166576754', 'ig', 'Achhnera'],
    ['2026-02-10T07:10:49+05:30', 'shristi Gupta', '+916299729067', 'ig', 'Jamshedpur'],
    ['2026-02-10T07:05:07+05:30', 'bhumihar bharman', '+919899021974', 'ig', 'New Delhi'],
    ['2026-02-10T07:02:40+05:30', 'Vansh_parjapat', '+918930409266', 'ig', 'Assandh'],
    ['2026-02-10T06:56:49+05:30', 'Harshit sharma', '+917056803995', 'ig', 'Hisar Haryana'],
    ['2026-02-10T06:44:31+05:30', '꧁. ρякαѕн(α+ρ)   .꧂', '+918292643281', 'ig', 'Jhitaki'],
    ['2026-02-10T06:42:01+05:30', 'Nobita<<', '+919667144989', 'ig', 'Shakurpur'],
    ['2026-02-10T06:36:20+05:30', '6hrishi_kesh9', '+917074371441', 'ig', 'Kolkata'],
    ['2026-02-10T06:33:04+05:30', 'Hasan_Malik', '+919922166365', 'ig', 'Giridih'],
    ['2026-02-10T06:27:14+05:30', 'Sanatan Bala', '+919209282717', 'ig', 'Pakhanjur'],
    ['2026-02-10T06:17:15+05:30', '༒ 𝐍𝐢𝐤𝐮𝐧𝐣 ༒', '7505067718', 'ig', 'Haridwar'],
    ['2026-02-10T06:12:47+05:30', '𝕡𝕣𝕒𝕤𝕙𝕒𝕟𝕥. 𝐬𝐚𝐢𝐧𝐢', '+919012406539', 'ig', 'Chandupura'],
    ['2026-02-10T05:54:19+05:30', 'アンクｌ', '+918510030640', 'ig', 'Gudgaon'],
    ['2026-02-10T05:43:08+05:30', 'billu jii', '+919288519800', 'ig', 'Bhagalpur'],
    ['2026-02-10T05:39:35+05:30', 'jay', '+919456153396', 'ig', 'Almora'],
    ['2026-02-10T05:07:44+05:30', '_.शुभम._', '+917631626910', 'ig', 'Purnea'],
    ['2026-02-10T03:52:05+05:30', '𝐑𝐂 𝐑𝐀𝐇𝐔𝐋', '+919109743075', 'ig', 'Rajnandgaon Chhattisgarh'],
    ['2026-02-10T02:08:44+05:30', 'VIHAN_7566', '+919812437740', 'ig', 'Kurukshetra'],
    ['2026-02-10T02:04:47+05:30', 'md misbahul huk', '+917323805210', 'ig', 'Simra tand  altaf singar and electric shop'],
    ['2026-02-10T01:52:39+05:30', '_𝕊𝔸ℂ𝑯𝕀ℕ_☆_ℝ𝔸𝑻𝑯𝕆ℝ𝔼_ROOPCHAND__RATHORE', '+918305346375', 'ig', 'Damoh'],
    ['2026-02-10T01:52:03+05:30', 'pradeep ~', '+919389989724', 'ig', 'Almora'],
    ['2026-02-10T01:21:49+05:30', 'Shweta chandra', '9399424683', 'ig', 'Janjgir champa'],
    ['2026-02-10T01:14:48+05:30', '༺★MɨnȺŧø456001', '+917470427643', 'ig', 'Sitapur'],
    ['2026-02-10T00:54:12+05:30', 'Laxman bariha', '+919131183310', 'ig', 'Basna'],
    ['2026-02-10T00:52:27+05:30', 'cute_aahil_0786', '+917988338242', 'ig', 'Punhana'],
    ['2026-02-10T00:46:17+05:30', 'ᱨᱟਨᱵᱦᱤᱨ', '9241432822', 'ig', 'Jamshedpur'],
    ['2026-02-10T00:36:58+05:30', 'Utkarsh', '+919368516897', 'ig', 'Siringar'],
    ['2026-02-10T00:36:47+05:30', '╰‿╯ꜱᴛᴀʀ  ᴘʀɪɴᴄᴇ ~ ❷⓿', '+918298562207', 'ig', 'Chhapra'],
    ['2026-02-10T00:32:00+05:30', '__XY__SALMAN___', '+919905316255', 'ig', 'Daltonganj palamu'],
    ['2026-02-10T00:13:30+05:30', 'Rajput', '+917580062535', 'ig', 'Himachal Pradesh'],
    ['2026-02-10T00:08:44+05:30', 'Baljit', '9814803594', 'ig', 'Punjab'],
    ['2026-02-10T00:00:10+05:30', 'SAURABH×MONEY', '+916206673330', 'ig', 'Ranchi']
];

async function run() {
    console.log('--- STARTING MANUAL DISTRIBUTION FOR TEAMFIRE (FIXED SYNTAX) ---');
    const today = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';

    const { data: teamUsers, error: usersError } = await supabase
        .from('users')
        .select('id, name')
        .eq('team_code', 'TEAMFIRE')
        .eq('is_active', true);

    if (usersError) throw usersError;

    const eligibleUsers = [];
    for (const user of teamUsers) {
        const { count } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', user.id)
            .gte('created_at', today);

        if (count === 0) {
            eligibleUsers.push(user);
        }
    }

    console.log(`Eligible users (0 leads today): ${eligibleUsers.length}`);
    if (eligibleUsers.length === 0) {
        console.log('No eligible users found. Stopping.');
        return;
    }

    eligibleUsers.sort((a, b) => a.name.localeCompare(b.name));

    let userIdx = 0;
    let batchCount = 0;
    let insertedLeads = 0;

    for (const lead of leadsData) {
        const [createdAt, name, phone, platform, city] = lead;
        const assignedTo = eligibleUsers[userIdx].id;

        const { error: insertError } = await supabase
            .from('leads')
            .insert({
                name,
                phone,
                source: "Meta - " + platform,
                assigned_to: assignedTo,
                user_id: assignedTo,
                status: 'fresh',
                created_at: createdAt,
                city,
            });

        if (!insertError) {
            insertedLeads++;
            console.log("✅ Assigned " + name + " -> " + eligibleUsers[userIdx].name);
        } else if (insertError.code === '23505') {
            console.log("⏩ Duplicate skipped: " + phone + " (" + name + ")");
        } else {
            console.error("❌ Error inserting " + name + " (" + phone + "):", insertError);
        }

        batchCount++;
        if (batchCount >= 2) {
            batchCount = 0;
            userIdx++;
            if (userIdx >= eligibleUsers.length) {
                userIdx = 0;
            }
        }
    }

    console.log("\n🚀 Mission Successful! Total " + insertedLeads + " fresh leads distributed.");
}

run().catch(console.error);
