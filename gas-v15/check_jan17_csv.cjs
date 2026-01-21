
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Setup Supabase
function loadEnv() {
    try {
        const paths = [
            path.join(process.cwd(), '.env'),
            path.join('C:', 'Users', 'HP', 'Downloads', 'new-crm-saas', '.env')
        ];
        for (const p of paths) {
            if (fs.existsSync(p)) {
                const envContent = fs.readFileSync(p, 'utf8');
                const env = {};
                envContent.split('\n').forEach(line => {
                    const [key, ...parts] = line.split('=');
                    if (key && parts.length > 0) env[key.trim()] = parts.join('=').trim().replace(/^["']|["']$/g, '');
                });
                return env;
            }
        }
    } catch (e) { return process.env; }
    return {};
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Data Provided by User
const rawData = `
Jagpreet Singh	p:9115118146
Jashanpreet kaur	p:7696703991
Vipan Sandhu	p:7009691509
Ajay Kumar	p:+918727920154
jashanpreet kaur	p:6284799005
ਭੱਟੀ ਸਾਬ	p:9569904389
Gagan Deep	p:+919805309001
Harpreet Singh	p:+918727000696
Kawaljit kaur	p:+918847316028
Jovenpreet Dulay	p:+919646288493
Jaswinder singh	p:951598396
Amanpreet	p:918708149026
Maninder Singh 0202	p:+919518688258
Sanjay Khanduri	p:+919780911996
Rishab Kumar	p:+916239591608
Preet singh	p:+918427499795
Sidhu	p:+919465540850
Jagjit Sandhu	p:+919872284420
Kamalpreet Singh	p:+919417832799
Arshpreet Singh	p:+918567000500
Hardeep kumar	p:+918194911513
Aman Deep kaur	p:+917889021069
Sandeep Singh	p:+918437528071
A̤m̤a̤n̤j̤i̤t̤ a̤m̤ṳ	p:+917986700342
𝓑𝓱𝓪𝓰𝔀𝓪𝓷 𝓢𝓲𝓷𝓰𝓱 𝓓𝓱𝓪𝓻𝓶𝓼𝓸𝓽	p:+917240516012
Navjot Kaur	p:+919056856410
official. sukh G sahota	p:+918360138879
Ajay sahota	p:+918264440071
Preet Brar	p:+916239412293
Inderveer mangat	p:+917087395090
Satnam Singh	p:+917986015418
Happy Barnala 5781	p:+918872782125
Jashan singh	p:9259548328
Kuldeep Brar	p:+919646368920
Parveen kaur	p:9779419019
PUNJAB	p:+918729088580
𝐋𝐨𝐯𝐞𝐩𝐫𝐞𝐞𝐭 𝐒𝐢𝐧𝐠𝐡	p:+919855730236
Pinder Batish	p:9350048314
G. i. l. l_h.u.n.i	p:+918146528573
Preet Garg	p:+917087555686
Rana singh	p:+919814194016
hunjjan pvc work jhabbar	p:+919877512631
Anmol deep	p:+919872032733
Ramanpreet Singh	p:+916280410710
sandeep_brar____	p:+916280419068
Rocky Mattu	p:+917814461968
diljaan bhatti	p:+917973360553
Ramy	p:+917087567293
ਸਿਮਰਨਜੀਤ ਸਿੰਘ ਸ਼ੇਰਗਿੱਲ	p:+919877895048
Sharma Sharma	p:+918360606351
Sony singh	p:+919872612329
Ăℝѕⲏ∂ǝǝρ*॰¨̮ ♡➳♡¯ツ	p:+919888322171
ਸਾਹਿਲ	p:7986754610
Daljit Singh	p:+917625886591
`;

// Target Emails
const targetEmails = [
    'workwithrajwinder@gmail.com',
    'sunnymehre451@gmail.com',
    'gurnambal01@gmail.com',
    'rajnikaler01@gmail.com'
];

async function checkLeads() {
    console.log("🔍 Starting Analysis...");

    // 1. Get Target User IDs
    const { data: users, error: uErr } = await supabase
        .from('users')
        .select('id, email, name')
        .in('email', targetEmails);

    if (uErr) { console.error("Error fetching users", uErr); return; }

    const userMap = {}; // ID -> Name
    const targetIds = new Set();
    users.forEach(u => {
        userMap[u.id] = u.name || u.email;
        targetIds.add(u.id);
        console.log(`✅ Found Target: ${u.email} -> ${u.name}`);
    });

    // 2. Process Input Data
    const rows = rawData.trim().split('\n');
    console.log(`📋 Processing ${rows.length} input leads...`);

    let stats = {
        total: rows.length,
        foundInDB: 0,
        notFound: 0,
        assignedToTarget: 0,
        assignedToOthers: 0,
        unassigned: 0,
        byUser: {},
        unassignedNames: [],
        missingDetails: []
    };

    targetIds.forEach(id => stats.byUser[id] = 0);

    for (const row of rows) {
        const [name, rawPhone] = row.split('\t');
        if (!rawPhone) continue;

        // Clean Phone: Remove p:, spaces, +91, get last 10 digits
        const cleanPhone = rawPhone.replace(/[^\d]/g, '').slice(-10);

        // Search in DB
        // We use 'like' with %phone because numbers stored might vary slightly
        const { data: leads, error } = await supabase
            .from('leads')
            .select('id, assigned_to, status, name')
            .ilike('phone', `%${cleanPhone}%`)
            .limit(1);

        if (leads && leads.length > 0) {
            stats.foundInDB++;
            const lead = leads[0];

            if (lead.assigned_to) {
                if (targetIds.has(lead.assigned_to)) {
                    stats.assignedToTarget++;
                    stats.byUser[lead.assigned_to]++;
                } else {
                    stats.assignedToOthers++;
                }
            } else {
                stats.unassigned++;
                stats.unassignedNames.push(`${name} (${cleanPhone}) - Status: ${lead.status}`);
            }
        } else {
            stats.notFound++;
            // Deep Dive for Missing
            stats.missingDetails.push({ name, phone: cleanPhone, raw: rawPhone });
        }
    }

    // 3. Print Report
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 ANALYSIS REPORT");
    console.log(`Total Input Leads:  ${stats.total}`);
    console.log(`Found in Database:  ${stats.foundInDB}`);
    console.log(`Missing from DB:    ${stats.notFound}`);
    console.log("----------------------------------------");
    console.log(`✅ Assigned to Targets: ${stats.assignedToTarget}`);
    users.forEach(u => console.log(`   - ${u.name || u.email}: ${stats.byUser[u.id]}`));
    console.log("----------------------------------------");
    console.log(`📤 Assigned to OTHERS:  ${stats.assignedToOthers}`);
    console.log(`🛑 UNASSIGNED (Pending): ${stats.unassigned}`);

    if (stats.unassigned > 0) {
        console.log("\nPending List:");
        stats.unassignedNames.forEach(n => console.log(`   - ${n}`));
    }

    // 4. Report on MISSING Leads
    if (stats.missingDetails.length > 0) {
        console.log("\n🕵️‍♂️ DEEP DIVE: WHY ARE THESE MISSING? (Strict Phone Check)");
        for (const m of stats.missingDetails) {
            // Check existence by Partial Phone (Last 8 digits) - STRICT CHECK
            const partialPhone = m.phone.slice(-8); // Last 8 digits to be safe
            const { data: phoneMatch } = await supabase
                .from('leads')
                .select('id, phone, name, assigned_to, status, created_at')
                .ilike('phone', `%${partialPhone}%`)
                .limit(1);

            if (phoneMatch && phoneMatch.length > 0) {
                const match = phoneMatch[0];
                let assignedName = "Unassigned";
                if (match.assigned_to) {
                    // Fetch assignee name if possible, or just ID
                    assignedName = `User ID: ${match.assigned_to}`;
                    if (match.assigned_to in stats.byUser) {
                        // It is one of our targets?
                        // We already checked this in the main loop, but maybe the phone format differed slightly there?
                        // Let's rely on the main stats for "Assigned to Target", this is just for debugging "Missing".
                    }
                }

                console.log(`⚠️ FOUND NOW (Phone Match): ${m.name} (${m.phone})`);
                console.log(`   -> Defined in DB as: ${match.name} (${match.phone})`);
                console.log(`   -> Status: ${match.status} | Assigned To: ${match.assigned_to || 'NULL'}`);
            } else {
                console.log(`❌ DEFINITELY NOT IN DB: ${m.name} (${m.phone})`);
            }
        }
    }
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

checkLeads();
