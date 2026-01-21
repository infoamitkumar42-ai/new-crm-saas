
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Hardcoded paths for reliability
const envPath = 'C:\\Users\\HP\\Downloads\\new-crm-saas\\.env';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...parts] = line.split('=');
    if (key && parts.length > 0) env[key.trim()] = parts.join('=').trim().replace(/^["']|["']$/g, '');
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_EMAILS = [
    'jashandeepkaur6444@gmail.com',
    'dineshmonga22@gmail.com',
    'rupanasameer551@gmail.com',
    'loveleensharma530@gmail.com'
];

async function checkBatchUsers() {
    console.log("🔍 Checking 4 Specific Users...\n");

    const { data: users, error } = await supabase
        .from('users')
        .select('name, email, leads_today, daily_limit, is_active, plan_name')
        .in('email', TARGET_EMAILS);

    if (error) { console.error("❌ Error:", error); return; }

    TARGET_EMAILS.forEach(email => {
        const user = users.find(u => u.email === email);
        if (user) {
            console.log(`👤 ${user.name}`);
            console.log(`   - Leads Today: ${user.leads_today} / ${user.daily_limit}`);
            console.log(`   - Active: ${user.is_active}`);
            console.log(`   - Status: ${user.leads_today > 0 ? "✅ Received Leads" : "⚠️ 0 Leads (Check Reason)"}`);
            console.log("-------------------------------------------------");
        } else {
            console.log(`❌ User Not Found: ${email}`);
        }
    });
}

checkBatchUsers();
