
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

async function checkZeroLeadUsers() {
    console.log("🔍 Checking for Active Users with 0 Leads Today...\n");

    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('is_active', true)
        .neq('plan_name', 'none')
        .gt('daily_limit', 0); // Only those who CAN receive leads

    if (error) { console.error("❌ Error:", error); return; }

    const zeroLeadUsers = users.filter(u => (u.leads_today || 0) === 0);

    console.log(`📊 Found ${zeroLeadUsers.length} Active Users with 0 Leads:`);

    if (zeroLeadUsers.length === 0) {
        console.log("✅ None! Everyone has at least 1 lead.");
    } else {
        zeroLeadUsers.forEach(u => {
            console.log(`   🔸 ${u.name} (Limit: ${u.daily_limit}, Manager: ${u.manager_id ? 'Yes' : 'No'})`);
        });
    }
}

checkZeroLeadUsers();
