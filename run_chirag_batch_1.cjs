
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const TEAM_CODE = 'GJ01TEAMFIRE';

// LEADS DATA (Batch 1 - ~100 Leads)
const leadsData = [
    { name: 'Dharmesh Donda', phone: '9624249683', city: 'Surat', source: 'New chirag campaing (ig)', date: '2026-02-05T18:02:08+05:30' },
    { name: 'Francis Broachwala', phone: '7041846785', city: 'Vadodara', source: 'New chirag campaing (ig)', date: '2026-02-05T17:54:18+05:30' },
    { name: 'Hunter Lion..', phone: '9574490397', city: 'Rajula', source: 'New chirag campaing (ig)', date: '2026-02-05T17:49:25+05:30' },
    { name: 'Vipul Sodha Vipul Sodha', phone: '9265228143', city: 'Ahmedabad', source: 'New chirag campaing (ig)', date: '2026-02-05T16:41:51+05:30' },
    { name: 'Kiran Shah', phone: '8128153498', city: 'દેહ ગામ', source: 'New chirag campaing (ig)', date: '2026-02-05T16:39:28+05:30' },
    { name: 'Juhi Tejas Patel', phone: '9662624788', city: 'Ahmedabad', source: 'New chirag campaing (ig)', date: '2026-02-05T16:07:14+05:30' },
    { name: 'Nitin Patel', phone: '9106009254', city: 'Patan', source: 'New chirag campaing (ig)', date: '2026-02-05T16:01:11+05:30' },
    { name: 'Vadher Hitendrasinh', phone: '9016893200', city: 'Dwarka', source: 'New chirag campaing (ig)', date: '2026-02-05T15:55:50+05:30' },
    { name: '!!! दरबार अजय सिंह !!!', phone: '9558104758', city: 'Raner', source: 'New chirag campaing (ig)', date: '2026-02-05T15:39:23+05:30' },
    { name: 'Kishan Panchasara', phone: '9016082256', city: 'Bhavnagar', source: 'New chirag campaing (ig)', date: '2026-02-05T15:23:39+05:30' },
    { name: 'Maheta Viral', phone: '9824394303', city: 'Rajkot', source: 'New chirag campaing (ig)', date: '2026-02-05T15:19:07+05:30' },
    { name: 'VICKY ZALA', phone: '9099999820', city: 'Rajkot', source: 'New chirag campaing (ig)', date: '2026-02-05T15:11:25+05:30' },
    { name: 'Jitrajsinh Rajendrasinh Gohil', phone: '9624567454', city: 'Gariyadhar', source: 'New chirag campaing (ig)', date: '2026-02-05T14:29:16+05:30' },
    { name: 'Jignesh  N. Patel', phone: '9173902268', city: 'Ahmedabad Gujarat', source: 'New chirag campaing (ig)', date: '2026-02-05T14:15:25+05:30' },
    { name: 'jay', phone: '8469851562', city: 'Surat', source: 'New chirag campaing (ig)', date: '2026-02-05T14:05:13+05:30' },
    { name: 'Jugal Patel', phone: '9998985933', city: 'Unjha', source: 'New chirag campaing (ig)', date: '2026-02-05T13:34:06+05:30' },
    { name: 'Hi', phone: '8866101683', city: 'ArifJat', source: 'New chirag campaing (ig)', date: '2026-02-05T13:30:44+05:30' },
    { name: 'VB', phone: '8128487117', city: 'KHEDA', source: 'New chirag campaing (ig)', date: '2026-02-05T13:24:26+05:30' },
    { name: 'Jαgdiѕh Gαjjαr', phone: '9879970888', city: 'Palanpur', source: 'New chirag campaing (ig)', date: '2026-02-05T13:19:06+05:30' },
    { name: 'Prince Munnu', phone: '9925668718', city: 'Bhavanagar', source: 'New chirag campaing (ig)', date: '2026-02-05T13:15:18+05:30' },
    { name: 'apps_ king', phone: '7600437507', city: 'Amadavad', source: 'New chirag campaing (ig)', date: '2026-02-05T13:08:41+05:30' },
    { name: 'Prakash Mithpara', phone: '9104552983', city: 'Surendranagar', source: 'New chirag campaing (ig)', date: '2026-02-05T13:05:59+05:30' },
    { name: 'Vishal Raval', phone: '9313564606', city: 'Kadi', source: 'New chirag campaing (ig)', date: '2026-02-05T13:05:47+05:30' },
    { name: 'Vinay Chavda', phone: '9662170855', city: 'Kutch', source: 'New chirag campaing (ig)', date: '2026-02-05T13:05:27+05:30' },
    { name: 'Jigar Ja Ratĥoď', phone: '9328298491', city: 'Datrai', source: 'New chirag campaing (ig)', date: '2026-02-05T13:00:49+05:30' },
    { name: 'Jadeja Pruthavirajsinh', phone: '6355680762', city: 'Bhuj', source: 'New chirag campaing (ig)', date: '2026-02-05T12:54:32+05:30' },
    { name: 'Khushbu', phone: '9724212639', city: 'Ahmedanad', source: 'New chirag campaing (ig)', date: '2026-02-05T12:39:25+05:30' },
    { name: 'Virali shihora', phone: '8401944047', city: 'Surat', source: 'New chirag campaing (ig)', date: '2026-02-05T12:25:57+05:30' },
    { name: 'Vishnu Chaudhari', phone: '8320202488', city: 'ℂ𝕙𝕒𝕖𝕞𝕓𝕦𝕧𝕒 𝔹𝕙𝕒𝕓𝕙𝕒𝕣 𝔾𝕦𝕛𝕣𝕒𝕥', source: 'New chirag campaing (ig)', date: '2026-02-05T12:10:41+05:30' },
    { name: 'Nanda Parmar', phone: '7383526338', city: 'Vadodara', source: 'New chirag campaing (ig)', date: '2026-02-05T12:10:28+05:30' },
    { name: 'RP__', phone: '9727556133', city: 'Harij', source: 'New chirag campaing (ig)', date: '2026-02-05T11:17:47+05:30' },
    { name: 'Pradipsinh Vaghela', phone: '9825028082', city: 'Ahmedabad', source: 'New chirag campaing (ig)', date: '2026-02-05T11:14:04+05:30' },
    { name: 'Aman mali', phone: '9510238889', city: 'Vadodara', source: 'New chirag campaing (ig)', date: '2026-02-05T07:55:34+05:30' },
    { name: 'Piyush Vekariya', phone: '8758161439', city: 'Surat', source: 'New chirag campaing (ig)', date: '2026-02-06T10:29:06+05:30' },
    { name: 'Chetan Barot', phone: '8141032345', city: 'himatnagar', source: 'New chirag campaing (fb)', date: '2026-02-06T10:00:26+05:30' },
    { name: 'Vishal Parmar', phone: '7043153909', city: 'Ahmadabad', source: 'New chirag campaing (ig)', date: '2026-02-06T08:34:56+05:30' },
    { name: 'Vrushangi Dabhi', phone: '7698467419', city: 'Ahmedabad', source: 'New chirag campaing (ig)', date: '2026-02-05T21:47:01+05:30' },
    { name: 'NARESH_D$AI', phone: '9737571442', city: 'Deesa', source: 'New chirag campaing (ig)', date: '2026-02-05T21:44:46+05:30' },
    { name: 'Mukesh Damor', phone: '9726259421', city: 'Ahamdaband', source: 'New chirag campaing (ig)', date: '2026-02-05T21:06:25+05:30' },
    { name: 'H K.  prajapati 143', phone: '8758185046', city: '360055', source: 'New chirag campaing (ig)', date: '2026-02-05T20:15:16+05:30' },
    { name: 'saurin shah', phone: '8928100618', city: 'Mumbai', source: 'New chirag campaing (ig)', date: '2026-02-05T20:02:41+05:30' },
    { name: '𝚱 𝚱', phone: '8849408951', city: 'Kevin', source: 'New chirag campaing (ig)', date: '2026-02-05T19:49:10+05:30' },
    { name: 'તુષારભાઇ ખંમળ આહિર', phone: '9726595946', city: 'Sihor', source: 'New chirag campaing (ig)', date: '2026-02-05T17:30:19+05:30' },
    { name: 'Kiran', phone: '7069552930', city: 'Deodar', source: 'New chirag campaing (ig)', date: '2026-02-05T16:04:06+05:30' },
    { name: 'Mayur Umavanshi', phone: '9979973848', city: 'Ahmedabad', source: 'New chirag campaing (ig)', date: '2026-02-05T11:16:27+05:30' },
    { name: 'Sarvan Thakur Thakur', phone: '8849550498', city: 'ભાભર', source: 'New chirag campaing (ig)', date: '2026-02-05T11:14:52+05:30' },
    { name: 'Rahul Anand', phone: '9898718745', city: 'Khambhat', source: 'New chirag campaing (ig)', date: '2026-02-05T11:13:50+05:30' },
    { name: 'G.J.BHARWAD', phone: '9979255582', city: 'Ahmedabad', source: 'New chirag campaing (ig)', date: '2026-02-05T11:13:37+05:30' },
    { name: 'Dilip Odedra', phone: '9106603453', city: 'Porbandar', source: 'New chirag campaing (fb)', date: '2026-02-05T15:53:57+05:30' },
    { name: 'Ashok, d, Prajapati,', phone: '9537664531', city: 'Amadavad', source: 'New chirag campaing (ig)', date: '2026-02-05T15:30:51+05:30' },
    { name: 'Minaxiben r Prajapati', phone: '6351287627', city: 'Nadiya', source: 'New chirag campaing (ig)', date: '2026-02-05T15:30:19+05:30' },
    { name: 'Minaxi Mehta', phone: '9377729888', city: 'Surat', source: 'New chirag campaing (ig)', date: '2026-02-05T15:30:07+05:30' },
    { name: 'Soyab Darbar', phone: '9870074595', city: 'ahemdabad', source: 'New chirag campaing (ig)', date: '2026-02-05T13:34:17+05:30' },
    { name: 'Sweta Chauhan', phone: '9601848618', city: 'Ahmedabad', source: 'New chirag campaing (ig)', date: '2026-02-05T13:19:11+05:30' },
    { name: 'Paresh Bhai Kanabar', phone: '9924570956', city: 'una', source: 'New chirag campaing (fb)', date: '2026-02-05T13:16:38+05:30' },
    { name: 'Kevin Ghodasara', phone: '7874790557', city: 'pikhor', source: 'New chirag campaing (fb)', date: '2026-02-05T13:08:38+05:30' },
    { name: 'Rohit Thakor', phone: '8758231553', city: 'Palanpur', source: 'New chirag campaing (ig)', date: '2026-02-05T12:43:11+05:30' },
    { name: 'Virendra Rathva', phone: '7016263651', city: 'Jetpur Pavi', source: 'New chirag campaing (ig)', date: '2026-02-05T12:41:59+05:30' },
    { name: 'DIPAKSINH  ZALA', phone: '8799508253', city: 'Kalol', source: 'New chirag campaing (ig)', date: '2026-02-05T12:39:48+05:30' },
    { name: 'Jay Goga Reference', phone: '9998557161', city: 'Surat', source: 'New chirag campaing (fb)', date: '2026-02-05T12:37:33+05:30' },
    { name: 'Suresh', phone: '9724801248', city: 'Tharad', source: 'New chirag campaing (ig)', date: '2026-02-05T12:36:31+05:30' },
    { name: '𝓅Ⓡυ𝕊н𝐓ｉ', phone: '6351391918', city: 'Rajkot', source: 'New chirag campaing (ig)', date: '2026-02-05T12:35:57+05:30' },
    { name: 'dipakbhai m.sagar', phone: '7405560500', city: 'morbi . hadamatiya', source: 'New chirag campaing (fb)', date: '2026-02-05T12:32:42+05:30' },
    { name: 'Virat Prajapati', phone: '8799328383', city: 'Botad', source: 'New chirag campaing (ig)', date: '2026-02-05T12:31:56+05:30' },
    { name: 'Raju desai', phone: '9104068662', city: 'Sabarmati, ahmedabad', source: 'New chirag campaing (ig)', date: '2026-02-05T12:30:56+05:30' },
    { name: 'Jaydip Solanki', phone: '9586389185', city: 'Ahmedabad', source: 'New chirag campaing (ig)', date: '2026-02-05T12:25:26+05:30' },
    { name: 'Mehul Parmar', phone: '9265245427', city: 'Vadodara, Gujarat', source: 'New chirag campaing (ig)', date: '2026-02-05T12:11:21+05:30' },
    { name: 'Akash Parmar', phone: '9925759160', city: 'Baroda', source: 'New chirag campaing (ig)', date: '2026-02-05T12:11:15+05:30' },
    { name: 'HK Relax', phone: '7622947663', city: 'Mahuva', source: 'New chirag campaing (ig)', date: '2026-02-05T12:09:26+05:30' },
    { name: 'Keyuri Patel', phone: '9909277458', city: 'Vadodara', source: 'New chirag campaing (ig)', date: '2026-02-05T12:09:25+05:30' },
    { name: 'Roshni Patel', phone: '8866468077', city: 'Surat', source: 'New chirag campaing (ig)', date: '2026-02-05T12:08:20+05:30' },
    { name: 'Nilesh Gusai', phone: '9427818154', city: 'Bhuj', source: 'New chirag campaing (ig)', date: '2026-02-05T07:55:44+05:30' },
    { name: 'Lata Amrutbhai', phone: '9265404759', city: 'Ahmedabad', source: 'New chirag campaing (ig)', date: '2026-02-05T07:54:15+05:30' },
    { name: '__manish__07', phone: '9316881849', city: 'Navsari', source: 'New chirag campaing (ig)', date: '2026-02-06T10:02:01+05:30' },
    { name: 'Aaditya', phone: '8320796747', city: 'Jamnagar', source: 'New chirag campaing (ig)', date: '2026-02-06T09:57:18+05:30' },
    { name: 'Jiya prajapati', phone: '6359150517', city: 'Ahemdabad', source: 'New chirag campaing (ig)', date: '2026-02-06T08:33:47+05:30' },
    { name: 'Jay Mangwani', phone: '7984115080', city: 'Godhra', source: 'New chirag campaing (ig)', date: '2026-02-06T08:27:12+05:30' },
    { name: 'Narendra  kharadi', phone: '9726053008', city: 'Meghraj', source: 'New chirag campaing (ig)', date: '2026-02-06T08:26:15+05:30' },
    { name: 'RAHULKUMAR SURESHBHAI THAKOR', phone: '9714824207', city: 'ANAND', source: 'New chirag campaing (fb)', date: '2026-02-06T08:26:15+05:30' },
    { name: 'Bhavik Parmar', phone: '7383085888', city: 'Vadodara', source: 'New chirag campaing (ig)', date: '2026-02-06T08:24:57+05:30' },
    { name: 'Mituu', phone: '9327991150', city: 'Bilimora', source: 'New chirag campaing (ig)', date: '2026-02-06T08:21:39+05:30' },
    { name: 'paramar vishnuji natavsrji', phone: '9023299907', city: 'ડીસા', source: 'New chirag campaing (ig)', date: '2026-02-05T21:48:19+05:30' },
    { name: 'Vishal Sen', phone: '9630904879', city: 'Dahod', source: 'New chirag campaing (ig)', date: '2026-02-05T21:34:37+05:30' },
    { name: 'ER Vishal Prajapati', phone: '9106472525', city: 'Mehsana', source: 'New chirag campaing (ig)', date: '2026-02-05T21:29:27+05:30' },
    { name: 'Sindhav Jayshree', phone: '7884450841', city: 'Rajkot', source: 'New chirag campaing (ig)', date: '2026-02-05T21:15:56+05:30' },
    { name: 'Chintan Sinh Dabhi', phone: '8140223241', city: 'Kadi', source: 'New chirag campaing (ig)', date: '2026-02-05T21:10:11+05:30' },
    { name: 'Pathak Sanjay', phone: '9664651562', city: 'Patan', source: 'New chirag campaing (ig)', date: '2026-02-05T20:56:06+05:30' },
    { name: 'Nilesh Bhil', phone: '9316280625', city: 'Vadodara Alkapuri', source: 'New chirag campaing (ig)', date: '2026-02-05T20:53:12+05:30' },
    { name: 'Anvesh Udrala', phone: '9104571837', city: 'Dahod', source: 'New chirag campaing (ig)', date: '2026-02-05T20:39:54+05:30' },
    { name: 'Ashvin Chauhan', phone: '9099427364', city: 'Melan', source: 'New chirag campaing (ig)', date: '2026-02-05T20:24:20+05:30' },
    { name: 'Dhruv Bhavsar', phone: '9265812521', city: 'Ahemdabad', source: 'New chirag campaing (ig)', date: '2026-02-05T20:19:07+05:30' },
    { name: 'Milan Patel', phone: '8401551457', city: 'Surat', source: 'New chirag campaing (ig)', date: '2026-02-05T20:09:45+05:30' },
    { name: 'Suheb Kaji', phone: '9714048074', city: 'mahUVA', source: 'New chirag campaing (ig)', date: '2026-02-05T20:07:43+05:30' },
    { name: 'Anil Parmar', phone: '8320502901', city: 'Dahod', source: 'New chirag campaing (ig)', date: '2026-02-05T20:07:36+05:30' },
    { name: 'Bhavesh Prajapati', phone: '9537382648', city: 'Palanpur', source: 'New chirag campaing (ig)', date: '2026-02-05T20:00:32+05:30' },
    { name: 'Savan Thakor', phone: '6356397695', city: 'Mehsana', source: 'New chirag campaing (ig)', date: '2026-02-05T19:58:33+05:30' },
    { name: 'Paras Mehta', phone: '9409207019', city: 'Jamngar', source: 'New chirag campaing (ig)', date: '2026-02-05T19:54:46+05:30' },
    { name: 'Rashmikant Parekh', phone: '9825195037', city: 'Mahemdavad', source: 'New chirag campaing (fb)', date: '2026-02-05T19:52:53+05:30' },
    { name: 'Sarvaiya Arjunsinh', phone: '7069635485', city: 'Mahuva', source: 'New chirag campaing (ig)', date: '2026-02-05T19:50:58+05:30' },
    { name: 'Riddhil   lathia', phone: '9819051025', city: 'અમદાવાદ', source: 'New chirag campaing (ig)', date: '2026-02-05T19:50:26+05:30' },
    { name: 'Mahes Limbdiya', phone: '7990976592', city: 'Rajkot', source: 'New chirag campaing (ig)', date: '2026-02-05T19:46:56+05:30' }
];

async function distribute() {
    console.log(`🚀 STARTING DISTRIBUTION OF ${leadsData.length} LEADS FOR TEAM ${TEAM_CODE}...`);

    // 1. Get Eligible Team Members
    const { data: team, error: tError } = await supabase
        .from('users')
        .select('id, name, leads_today')
        .eq('team_code', TEAM_CODE)
        .eq('is_active', true)
        // Check filtering in Memory if needed, but SQL is better
        .in('plan_name', ['starter', 'supervisor', 'manager', 'weekly_boost', 'turbo_boost']);

    if (tError || !team || team.length === 0) {
        console.error("❌ NO ACTIVE TEAM MEMBERS FOUND! Aborting.", tError);
        return;
    }

    console.log(`✅ Active Members: ${team.length}`);

    let assignedCount = 0;
    let duplicateCount = 0;

    // 2. Loop & Assign
    for (let i = 0; i < leadsData.length; i++) {
        const lead = leadsData[i];

        // Round Robin User
        const targetUser = team[i % team.length];

        // Upsert Lead
        // 'lead_created_at' in SQL was source. I'll use current time for insertion or parse?
        // User provided date: '2026-02-05...'

        const { error: upsertError } = await supabase.from('leads').upsert({
            phone_number: lead.phone,
            full_name: lead.name,
            city: lead.city,
            source: lead.source,
            status: 'Assigned',
            assigned_to: targetUser.id,
            user_id: targetUser.id,
            created_at: new Date(lead.date).toISOString(), // Ensure ISO
            assigned_at: new Date().toISOString()
        }, { onConflict: 'phone_number' });

        if (upsertError) {
            console.error(`Status: Error inserting ${lead.phone}:`, upsertError.message);
        } else {
            assignedCount++;

            // Send Notification (Fire & Forget)
            supabase.from('notifications').insert({
                user_id: targetUser.id,
                title: 'New Lead Assigned',
                message: `Lead: ${lead.name}`,
                type: 'lead_assignment'
            }).then(() => { });
        }
    }

    console.log(`\n🎉 DONE! Processed: ${assignedCount} leads.`);
}

distribute();
