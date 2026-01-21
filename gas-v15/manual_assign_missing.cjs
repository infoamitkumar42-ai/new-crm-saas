
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

// 2. Data to Insert (The 10 Missing Leads)
const leadsToInsert = [
    { name: "Jagpreet Singh", phone: "9115118146" },
    { name: "Jashanpreet kaur", phone: "7696703991" },
    { name: "Vipan Sandhu", phone: "7009691509" },
    { name: "Ajay Kumar", phone: "8727920154" },
    { name: "jashanpreet kaur", phone: "6284799005" },
    { name: "ਭੱਟੀ ਸਾਬ", phone: "9569904389" },
    { name: "Gagan Deep", phone: "9805309001" },
    { name: "Harpreet Singh", phone: "8727000696" },
    { name: "Jaswinder singh", phone: "951598396" },
    { name: "Amanpreet", phone: "8708149026" }
];

// Target Emails
const targetEmails = [
    'workwithrajwinder@gmail.com',
    'sunnymehre451@gmail.com',
    'gurnambal01@gmail.com',
    'rajnikaler01@gmail.com'
];

async function assignLeads() {
    console.log("🚀 Starting Manual Assignment...");

    // 1. Get Target User IDs
    const { data: users, error: uErr } = await supabase
        .from('users')
        .select('id, email, name')
        .in('email', targetEmails);

    if (uErr || !users) { console.error("Error fetching users", uErr); return; }

    // Sort to ensure consistent rotation order
    users.sort((a, b) => a.email.localeCompare(b.email));

    console.log(`👥 Found ${users.length} Users for distribution.`);
    users.forEach(u => console.log(`   - ${u.name} (${u.email})`));

    // 2. Insert and Assign
    let userIndex = 0;
    let successCount = 0;

    for (const lead of leadsToInsert) {
        // Round Robin User Selection
        const assignedUser = users[userIndex % users.length];
        userIndex++;

        // Clean Phone (Ensure +91)
        let cleanPhone = lead.phone.replace(/[^\d]/g, '');
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
            console.log(`✅ Assigned: ${lead.name.padEnd(20)} -> ${assignedUser.name}`);
            successCount++;
        }
    }

    console.log(`\n🎉 Done! Successfully assigned ${successCount} leads.`);
}

assignLeads();
