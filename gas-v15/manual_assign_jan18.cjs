
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

// 2. Data to Insert (13 Leads)
const leadsToInsert = [
    { name: "Pardeep Singh", phone: "+918528533035" },
    { name: "Param", phone: "+919478938480" },
    { name: "ManDeep Singh AtWal", phone: "+918196920003" },
    { name: "Dasi Darshan", phone: "+918847581233" },
    { name: "Baljit Khehra Baljit", phone: "+919872299711" },
    { name: "gaggu kuor", phone: "+919877988836" },
    { name: "Lovepreet", phone: "+916283882149" },
    { name: "Jugraj Singh", phone: "+918198013286" },
    { name: "Atwal Ajay", phone: "+918196067853" },
    { name: "ਹਰਮਨ", phone: "+918968291909" },
    { name: "Manpreet kaur", phone: "+918146859294" },
    { name: "Deepak Mahla", phone: "+919915839112" },
    { name: "Parminder", phone: "+917935416745" }
];

// Config
const SPECIAL_USER_EMAIL = 'workwithrajwinder@gmail.com';
const SPECIAL_QUOTA = 5;

const OTHER_EMAILS = [
    'sunnymehre451@gmail.com',
    'gurnambal01@gmail.com',
    'rajnikaler01@gmail.com'
];

async function assignLeads() {
    console.log("🚀 Starting Custom Assignment (Jan 18)...");

    // 1. Fetch Users
    const allEmails = [SPECIAL_USER_EMAIL, ...OTHER_EMAILS];
    const { data: users, error: uErr } = await supabase
        .from('users')
        .select('id, email, name')
        .in('email', allEmails);

    if (uErr || !users) { console.error("Error fetching users", uErr); return; }

    const specialUser = users.find(u => u.email === SPECIAL_USER_EMAIL);
    const otherUsers = users.filter(u => u.email !== SPECIAL_USER_EMAIL);

    // Sort others for consistent round robin
    otherUsers.sort((a, b) => a.email.localeCompare(b.email));

    if (!specialUser) {
        console.error("❌ Rajwinder not found!");
        return;
    }

    console.log(`🎯 Strategy: Give 5 to ${specialUser.name}, rest to ${otherUsers.length} others.`);

    let distributedCount = 0;
    let otherUserIndex = 0;

    for (let i = 0; i < leadsToInsert.length; i++) {
        const lead = leadsToInsert[i];
        let assignedUser = null;

        // Logic: First 5 go to Rajwinder
        if (i < SPECIAL_QUOTA) {
            assignedUser = specialUser;
        } else {
            // Rest go Round Robin to others
            assignedUser = otherUsers[otherUserIndex % otherUsers.length];
            otherUserIndex++;
        }

        // Clean Phone
        let cleanPhone = lead.phone.replace(/[^\d]/g, '');
        // Assuming user provided +91 already, but safety check:
        // User provided: +918528533035 -> 918528533035 (12 digits) -> OK
        if (cleanPhone.length === 10) cleanPhone = '+91' + cleanPhone;
        else if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) cleanPhone = '+' + cleanPhone;

        const payload = {
            name: lead.name,
            phone: cleanPhone,
            assigned_to: assignedUser.id,
            status: 'New',
            source: 'Manual Restoration (Jan 18)',
            created_at: new Date().toISOString(),
            is_valid_phone: true
        };

        const { error } = await supabase.from('leads').insert(payload);

        if (error) {
            console.error(`❌ Failed to insert ${lead.name}:`, error.message);
        } else {
            console.log(`✅ [${i + 1}/${leadsToInsert.length}] ${lead.name.padEnd(20)} -> ${assignedUser.name}`);
            distributedCount++;
        }
    }

    console.log(`\n🎉 Done! Assigned ${distributedCount} leads.`);
}

assignLeads();
