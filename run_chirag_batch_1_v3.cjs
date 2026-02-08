
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const TEAM_CODE = 'GJ01TEAMFIRE';

// LEADS DATA (Batch 1)
const leadsData = [
    { name: 'Dharmesh Donda', phone: '9624249683', city: 'Surat', source: 'New chirag campaing (ig)' },
    { name: 'Francis Broachwala', phone: '7041846785', city: 'Vadodara', source: 'New chirag campaing (ig)' },
    { name: 'Hunter Lion..', phone: '9574490397', city: 'Rajula', source: 'New chirag campaing (ig)' },
    { name: 'Vipul Sodha Vipul Sodha', phone: '9265228143', city: 'Ahmedabad', source: 'New chirag campaing (ig)' },
    { name: 'Kiran Shah', phone: '8128153498', city: 'દેહ ગામ', source: 'New chirag campaing (ig)' },
    { name: 'Juhi Tejas Patel', phone: '9662624788', city: 'Ahmedabad', source: 'New chirag campaing (ig)' },
    { name: 'Nitin Patel', phone: '9106009254', city: 'Patan', source: 'New chirag campaing (ig)' },
    { name: 'Vadher Hitendrasinh', phone: '9016893200', city: 'Dwarka', source: 'New chirag campaing (ig)' },
    { name: '!!! दरबार अजय सिंह !!!', phone: '9558104758', city: 'Raner', source: 'New chirag campaing (ig)' },
    { name: 'Kishan Panchasara', phone: '9016082256', city: 'Bhavnagar', source: 'New chirag campaing (ig)' },
    { name: 'Maheta Viral', phone: '9824394303', city: 'Rajkot', source: 'New chirag campaing (ig)' },
    { name: 'VICKY ZALA', phone: '9099999820', city: 'Rajkot', source: 'New chirag campaing (ig)' },
    { name: 'Jitrajsinh Rajendrasinh Gohil', phone: '9624567454', city: 'Gariyadhar', source: 'New chirag campaing (ig)' },
    { name: 'Jignesh  N. Patel', phone: '9173902268', city: 'Ahmedabad Gujarat', source: 'New chirag campaing (ig)' },
    { name: 'jay', phone: '8469851562', city: 'Surat', source: 'New chirag campaing (ig)' },
    { name: 'Jugal Patel', phone: '9998985933', city: 'Unjha', source: 'New chirag campaing (ig)' },
    { name: 'Hi', phone: '8866101683', city: 'ArifJat', source: 'New chirag campaing (ig)' },
    { name: 'VB', phone: '8128487117', city: 'KHEDA', source: 'New chirag campaing (ig)' },
    { name: 'Jαgdiѕh Gαjjαr', phone: '9879970888', city: 'Palanpur', source: 'New chirag campaing (ig)' },
    { name: 'Prince Munnu', phone: '9925668718', city: 'Bhavanagar', source: 'New chirag campaing (ig)' },
    { name: 'apps_ king', phone: '7600437507', city: 'Amadavad', source: 'New chirag campaing (ig)' },
    { name: 'Prakash Mithpara', phone: '9104552983', city: 'Surendranagar', source: 'New chirag campaing (ig)' },
    { name: 'Vishal Raval', phone: '9313564606', city: 'Kadi', source: 'New chirag campaing (ig)' },
    { name: 'Vinay Chavda', phone: '9662170855', city: 'Kutch', source: 'New chirag campaing (ig)' },
    { name: 'Jigar Ja Ratĥoď', phone: '9328298491', city: 'Datrai', source: 'New chirag campaing (ig)' },
    { name: 'Jadeja Pruthavirajsinh', phone: '6355680762', city: 'Bhuj', source: 'New chirag campaing (ig)' },
    { name: 'Khushbu', phone: '9724212639', city: 'Ahmedanad', source: 'New chirag campaing (ig)' },
    { name: 'Virali shihora', phone: '8401944047', city: 'Surat', source: 'New chirag campaing (ig)' },
    { name: 'Vishnu Chaudhari', phone: '8320202488', city: 'ℂ𝕙𝕒𝕖𝕞𝕓𝕦𝕧𝕒 𝔹𝕙𝕒𝕓𝕙𝕒𝕣 𝔾𝕦𝕛𝕣𝕒𝕥', source: 'New chirag campaing (ig)' },
    { name: 'Nanda Parmar', phone: '7383526338', city: 'Vadodara', source: 'New chirag campaing (ig)' },
    { name: 'RP__', phone: '9727556133', city: 'Harij', source: 'New chirag campaing (ig)' },
    { name: 'Pradipsinh Vaghela', phone: '9825028082', city: 'Ahmedabad', source: 'New chirag campaing (ig)' },
    { name: 'Aman mali', phone: '9510238889', city: 'Vadodara', source: 'New chirag campaing (ig)' },
    { name: 'Piyush Vekariya', phone: '8758161439', city: 'Surat', source: 'New chirag campaing (ig)' },
    { name: 'Chetan Barot', phone: '8141032345', city: 'himatnagar', source: 'New chirag campaing (fb)' },
    { name: 'Vishal Parmar', phone: '7043153909', city: 'Ahmadabad', source: 'New chirag campaing (ig)' },
    { name: 'Vrushangi Dabhi', phone: '7698467419', city: 'Ahmedabad', source: 'New chirag campaing (ig)' },
    { name: 'NARESH_D$AI', phone: '9737571442', city: 'Deesa', source: 'New chirag campaing (ig)' },
    { name: 'Mukesh Damor', phone: '9726259421', city: 'Ahamdaband', source: 'New chirag campaing (ig)' },
    { name: 'H K.  prajapati 143', phone: '8758185046', city: '360055', source: 'New chirag campaing (ig)' },
    { name: 'saurin shah', phone: '8928100618', city: 'Mumbai', source: 'New chirag campaing (ig)' },
    { name: '𝚱 𝚱', phone: '8849408951', city: 'Kevin', source: 'New chirag campaing (ig)' },
    { name: 'તુષારભાઇ ખંમળ આહિર', phone: '9726595946', city: 'Sihor', source: 'New chirag campaing (ig)' },
    { name: 'Kiran', phone: '7069552930', city: 'Deodar', source: 'New chirag campaing (ig)' },
    { name: 'Mayur Umavanshi', phone: '9979973848', city: 'Ahmedabad', source: 'New chirag campaing (ig)' },
    { name: 'Sarvan Thakur Thakur', phone: '8849550498', city: 'ભાભર', source: 'New chirag campaing (ig)' },
    { name: 'Rahul Anand', phone: '9898718745', city: 'Khambhat', source: 'New chirag campaing (ig)' },
    { name: 'G.J.BHARWAD', phone: '9979255582', city: 'Ahmedabad', source: 'New chirag campaing (ig)' },
    { name: 'Dilip Odedra', phone: '9106603453', city: 'Porbandar', source: 'New chirag campaing (fb)' },
    { name: 'Ashok, d, Prajapati,', phone: '9537664531', city: 'Amadavad', source: 'New chirag campaing (ig)' },
    { name: 'Minaxiben r Prajapati', phone: '6351287627', city: 'Nadiya', source: 'New chirag campaing (ig)' },
    { name: 'Minaxi Mehta', phone: '9377729888', city: 'Surat', source: 'New chirag campaing (ig)' },
    { name: 'Soyab Darbar', phone: '9870074595', city: 'ahemdabad', source: 'New chirag campaing (ig)' },
    { name: 'Sweta Chauhan', phone: '9601848618', city: 'Ahmedabad', source: 'New chirag campaing (ig)' },
    { name: 'Paresh Bhai Kanabar', phone: '9924570956', city: 'una', source: 'New chirag campaing (fb)' },
    { name: 'Kevin Ghodasara', phone: '7874790557', city: 'pikhor', source: 'New chirag campaing (fb)' },
    { name: 'Rohit Thakor', phone: '8758231553', city: 'Palanpur', source: 'New chirag campaing (ig)' },
    { name: 'Virendra Rathva', phone: '7016263651', city: 'Jetpur Pavi', source: 'New chirag campaing (ig)' },
    { name: 'DIPAKSINH  ZALA', phone: '8799508253', city: 'Kalol', source: 'New chirag campaing (ig)' },
    { name: 'Jay Goga Reference', phone: '9998557161', city: 'Surat', source: 'New chirag campaing (fb)' },
    { name: 'Suresh', phone: '9724801248', city: 'Tharad', source: 'New chirag campaing (ig)' },
    { name: '𝓅Ⓡυ𝕊н𝐓ｉ', phone: '6351391918', city: 'Rajkot', source: 'New chirag campaing (ig)' },
    { name: 'dipakbhai m.sagar', phone: '7405560500', city: 'morbi . hadamatiya', source: 'New chirag campaing (fb)' },
    { name: 'Virat Prajapati', phone: '8799328383', city: 'Botad', source: 'New chirag campaing (ig)' },
    { name: 'Raju desai', phone: '9104068662', city: 'Sabarmati, ahmedabad', source: 'New chirag campaing (ig)' },
    { name: 'Jaydip Solanki', phone: '9586389185', city: 'Ahmedabad', source: 'New chirag campaing (ig)' },
    { name: 'Mehul Parmar', phone: '9265245427', city: 'Vadodara, Gujarat', source: 'New chirag campaing (ig)' },
    { name: 'Akash Parmar', phone: '9925759160', city: 'Baroda', source: 'New chirag campaing (ig)' },
    { name: 'HK Relax', phone: '7622947663', city: 'Mahuva', source: 'New chirag campaing (ig)' },
    { name: 'Keyuri Patel', phone: '9909277458', city: 'Vadodara', source: 'New chirag campaing (ig)' },
    { name: 'Roshni Patel', phone: '8866468077', city: 'Surat', source: 'New chirag campaing (ig)' },
    { name: 'Nilesh Gusai', phone: '9427818154', city: 'Bhuj', source: 'New chirag campaing (ig)' },
    { name: 'Lata Amrutbhai', phone: '9265404759', city: 'Ahmedabad', source: 'New chirag campaing (ig)' },
    { name: '__manish__07', phone: '9316881849', city: 'Navsari', source: 'New chirag campaing (ig)' },
    { name: 'Aaditya', phone: '8320796747', city: 'Jamnagar', source: 'New chirag campaing (ig)' },
    { name: 'Jiya prajapati', phone: '6359150517', city: 'Ahemdabad', source: 'New chirag campaing (ig)' },
    { name: 'Jay Mangwani', phone: '7984115080', city: 'Godhra', source: 'New chirag campaing (ig)' },
    { name: 'Narendra  kharadi', phone: '9726053008', city: 'Meghraj', source: 'New chirag campaing (ig)' },
    { name: 'RAHULKUMAR SURESHBHAI THAKOR', phone: '9714824207', city: 'ANAND', source: 'New chirag campaing (fb)' },
    { name: 'Bhavik Parmar', phone: '7383085888', city: 'Vadodara', source: 'New chirag campaing (ig)' },
    { name: 'Mituu', phone: '9327991150', city: 'Bilimora', source: 'New chirag campaing (ig)' },
    { name: 'paramar vishnuji natavsrji', phone: '9023299907', city: 'ડીસા', source: 'New chirag campaing (ig)' },
    { name: 'Vishal Sen', phone: '9630904879', city: 'Dahod', source: 'New chirag campaing (ig)' },
    { name: 'ER Vishal Prajapati', phone: '9106472525', city: 'Mehsana', source: 'New chirag campaing (ig)' },
    { name: 'Sindhav Jayshree', phone: '7884450841', city: 'Rajkot', source: 'New chirag campaing (ig)' },
    { name: 'Chintan Sinh Dabhi', phone: '8140223241', city: 'Kadi', source: 'New chirag campaing (ig)' },
    { name: 'Pathak Sanjay', phone: '9664651562', city: 'Patan', source: 'New chirag campaing (ig)' },
    { name: 'Nilesh Bhil', phone: '9316280625', city: 'Vadodara Alkapuri', source: 'New chirag campaing (ig)' },
    { name: 'Anvesh Udrala', phone: '9104571837', city: 'Dahod', source: 'New chirag campaing (ig)' },
    { name: 'Ashvin Chauhan', phone: '9099427364', city: 'Melan', source: 'New chirag campaing (ig)' },
    { name: 'Dhruv Bhavsar', phone: '9265812521', city: 'Ahemdabad', source: 'New chirag campaing (ig)' },
    { name: 'Milan Patel', phone: '8401551457', city: 'Surat', source: 'New chirag campaing (ig)' },
    { name: 'Suheb Kaji', phone: '9714048074', city: 'mahUVA', source: 'New chirag campaing (ig)' },
    { name: 'Anil Parmar', phone: '8320502901', city: 'Dahod', source: 'New chirag campaing (ig)' },
    { name: 'Bhavesh Prajapati', phone: '9537382648', city: 'Palanpur', source: 'New chirag campaing (ig)' },
    { name: 'Savan Thakor', phone: '6356397695', city: 'Mehsana', source: 'New chirag campaing (ig)' },
    { name: 'Paras Mehta', phone: '9409207019', city: 'Jamngar', source: 'New chirag campaing (ig)' },
    { name: 'Rashmikant Parekh', phone: '9825195037', city: 'Mahemdavad', source: 'New chirag campaing (fb)' },
    { name: 'Sarvaiya Arjunsinh', phone: '7069635485', city: 'Mahuva', source: 'New chirag campaing (ig)' },
    { name: 'Riddhil   lathia', phone: '9819051025', city: 'અમદાવાદ', source: 'New chirag campaing (ig)' },
    { name: 'Mahes Limbdiya', phone: '7990976592', city: 'Rajkot', source: 'New chirag campaing (ig)' }
];

async function distribute() {
    console.log(`🚀 STARTING DISTRIBUTION OF ${leadsData.length} LEADS FOR TEAM ${TEAM_CODE}...`);

    const { data: team, error: tError } = await supabase
        .from('users')
        .select('id, name, leads_today')
        .eq('team_code', TEAM_CODE)
        .eq('is_active', true)
        .in('plan_name', ['starter', 'supervisor', 'manager', 'weekly_boost', 'turbo_boost']);

    if (tError || !team || team.length === 0) {
        console.error("❌ NO ACTIVE TEAM MEMBERS FOUND! Aborting.", tError);
        return;
    }

    console.log(`✅ Active Members: ${team.length}`);

    let assignedCount = 0;

    for (let i = 0; i < leadsData.length; i++) {
        const lead = leadsData[i];
        const targetUser = team[i % team.length];

        // 1. Check Existence
        const { data: existing } = await supabase
            .from('leads')
            .select('id')
            .eq('phone', lead.phone)
            .maybeSingle();

        const payload = {
            phone: lead.phone,
            name: lead.name,
            city: lead.city,
            source: lead.source,
            status: 'Assigned',
            assigned_to: targetUser.id,
            user_id: targetUser.id,
            // Force create/assign date to NOW so it appears in today's dashboard
            created_at: new Date().toISOString(),
            assigned_at: new Date().toISOString()
        };

        if (existing) {
            // UPDATE
            console.log(`.. Updating Lead ${lead.phone}`);
            await supabase.from('leads').update(payload).eq('id', existing.id);
        } else {
            // INSERT
            await supabase.from('leads').insert(payload);
        }

        assignedCount++;

        // Notification
        supabase.from('notifications').insert({
            user_id: targetUser.id,
            title: 'New Lead Assigned',
            message: `Lead: ${lead.name}`,
            type: 'lead_assignment'
        }).then(() => { });

    }

    console.log(`\n🎉 DONE! Processed: ${assignedCount} leads.`);
}

distribute();
