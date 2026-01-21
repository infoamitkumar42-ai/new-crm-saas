
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

// 2. Data to Insert (9 Leads)
const leadsToInsert = [
    { name: "Ravî Inder Singh♡", phone: "8726046173" },
    { name: "gurmeet kaur", phone: "8437512661" },
    { name: "Jasmeet Kocher", phone: "9463269432" },
    { name: "Dilveer Singh", phone: "9501066965" },
    { name: "Gurpreet", phone: "7696666539" },
    { name: "lovepreet Singh", phone: "9888951785" },
    { name: "ਸਿਮਰਨਜੋਤ ਸਿੰਘ ਬੱਲ", phone: "6280863492" },
    { name: "Diljit Singh Goraya", phone: "9878631881" },
    { name: "Navi Jhunir", phone: "6284672412" }
];

// Target Emails
const targetEmails = [
    'workwithrajwinder@gmail.com',
    'sunnymehre451@gmail.com',
    'gurnambal01@gmail.com',
    'rajnikaler01@gmail.com'
];

async function assignLeads() {
    console.log("🚀 Starting Manual Assignment (Batch 2)...");

    // 1. Get Target User IDs
    const { data: users, error: uErr } = await supabase
        .from('users')
        .select('id, email, name')
        .in('email', targetEmails);

    if (uErr || !users) { console.error("Error fetching users", uErr); return; }

    // Sort to ensure consistent rotation order
    users.sort((a, b) => a.email.localeCompare(b.email));

    console.log(`👥 Found ${users.length} Users for distribution.`);

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
            source: 'Manual Restoration (Jan 18 Batch 2)',
            created_at: new Date().toISOString(),
            is_valid_phone: true
        };

        const { error } = await supabase.from('leads').insert(payload);

        if (error) {
            console.error(`❌ Failed to insert ${lead.name}:`, error.message);
        } else {
            console.log(`✅ Assigned: ${lead.name.padEnd(25)} -> ${assignedUser.name}`);
            successCount++;
        }
    }

    console.log(`\n🎉 Done! Successfully assigned ${successCount} leads.`);
}

assignLeads();
