
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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

async function assignLeads() {
    console.log("🚀 Starting Manual Assignment of 16 Leads...");

    // 1. Target Users
    const targetEmails = [
        'workwithrajwinder@gmail.com',
        'sunnymehre451@gmail.com',
        'gurnambal01@gmail.com',
        'rajnikaler01@gmail.com'
    ];

    const { data: users, error: uErr } = await supabase
        .from('users')
        .select('id, name, email')
        .in('email', targetEmails);

    if (uErr || !users) { console.error("❌ Error fetching users:", uErr); return; }

    // Map email to ID
    const userMap = {};
    users.forEach(u => userMap[u.email] = u);

    // Verify all found
    targetEmails.forEach(email => {
        if (!userMap[email]) console.warn(`⚠️ Warning: User ${email} not found in DB!`);
    });

    const assigneeQueue = [
        userMap['workwithrajwinder@gmail.com'],
        userMap['sunnymehre451@gmail.com'],
        userMap['gurnambal01@gmail.com'],
        userMap['rajnikaler01@gmail.com']
    ].filter(u => !!u); // Filter out missing

    if (assigneeQueue.length === 0) { console.error("❌ No valid assignees found."); return; }

    // 2. Leads Data (Parsed from User Request)
    const rawLeads = [
        { name: "Shankar Singla", phone: "+917888813780", city: "Bathinda", created: "2026-01-18T11:22:35+05:30" },
        { name: "Arshdeep singh", phone: "+918427297139", city: "Bathinda", created: "2026-01-18T11:05:21+05:30" },
        { name: "Deepak Kumar", phone: "8437938298", city: "Hoshiarpur", created: "2026-01-18T10:46:58+05:30" },
        { name: "Guransh. 22", phone: "+918437327310", city: "Khemkarn", created: "2026-01-18T10:33:48+05:30" },
        { name: "Gurkeerat Sekhon", phone: "+918054432832", city: "Moga", created: "2026-01-18T10:31:56+05:30" },
        { name: "Iqbal Singh", phone: "+919529207688", city: "Anoopgarh", created: "2026-01-18T10:29:39+05:30" },
        { name: "MONIKA SHARMA", phone: "+917973515129", city: "Rajpura", created: "2026-01-18T10:29:05+05:30" },
        { name: "Simranpreet kaur", phone: "+917719799159", city: "Tanda", created: "2026-01-18T10:26:30+05:30" },
        { name: "Satvir Dhanday", phone: "+919501049100", city: "Patiala", created: "2026-01-18T10:04:53+05:30" },
        { name: "Lovepreet Singh", phone: "+917652902719", city: "Sangrur", created: "2026-01-18T10:02:09+05:30" },
        { name: "typing...", phone: "+918360132602", city: "Fatehgarh Sahib", created: "2026-01-18T09:56:54+05:30" },
        { name: "Harkaran Dhaliwal", phone: "9001947067", city: "Hanumangarh", created: "2026-01-18T09:54:34+05:30" },
        { name: "Gagandeep kaur", phone: "6284498817", city: "Talwandi sabo", created: "2026-01-18T09:51:46+05:30" },
        { name: "Nanak Jot", phone: "+917087545957", city: "khanna", created: "2026-01-18T09:43:57+05:30" },
        { name: "Davinder Nayak", phone: "+919729722113", city: "Abohar", created: "2026-01-18T09:42:51+05:30" },
        { name: "Vishal Rajput", phone: "+917508070393", city: "Patiala", created: "2026-01-18T09:41:30+05:30" }
    ];

    let userIndex = 0;

    for (const data of rawLeads) {
        // Clean Phone
        let phone = data.phone.replace(/[^0-9]/g, '');
        if (phone.length === 10) phone = '91' + phone;
        if (phone.length === 12 && phone.startsWith('91')) phone = '+' + phone;
        if (!phone.startsWith('+')) phone = '+' + phone;

        // Pick Assignee
        const assignee = assigneeQueue[userIndex % assigneeQueue.length];
        userIndex++;

        // Check if exists
        const { data: existing } = await supabase
            .from('leads')
            .select('id, assigned_to')
            .eq('phone', phone)
            .single();

        if (existing) {
            // Update
            console.log(`🔄 Updating ${data.name} -> ${assignee.name}`);
            await supabase
                .from('leads')
                .update({
                    assigned_to: assignee.id,
                    status: 'Assigned',
                    notes: `Manually Re-assigned to ${assignee.name} (Jan 18 Req)`
                })
                .eq('id', existing.id);

            // Increment Count
            await supabase.rpc('increment_leads_today', { user_id: assignee.id });

        } else {
            // Insert
            console.log(`➕ Inserting ${data.name} -> ${assignee.name}`);
            const { error: insErr } = await supabase
                .from('leads')
                .insert({
                    name: data.name,
                    phone: phone,
                    city: data.city,
                    source: 'Manual Import (Jan 18)',
                    status: 'Assigned',
                    assigned_to: assignee.id,
                    created_at: data.created,
                    notes: `Manually Imported & Assigned to ${assignee.name}`
                });

            if (insErr) console.error(`   ❌ Failed: ${insErr.message}`);
            else await supabase.rpc('increment_leads_today', { user_id: assignee.id });
        }
    }

    console.log(`\n🎉 Processed ${rawLeads.length} Leads.`);
}

assignLeads();
