
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

async function checkStates() {
    console.log("🔍 Checking User State Preferences (Punjab)...\n");

    const { data: users, error } = await supabase
        .from('users')
        .select('name, email, state_allow_all, preferred_states, leads_today, daily_limit')
        .eq('is_active', true)
        .neq('plan_name', 'none')
        .limit(20);

    if (error) { console.error("❌ Error:", error); return; }

    console.log(`👤 Checking First 20 Active Users:`);
    users.forEach(u => {
        let matchesPunjab = false;
        if (u.state_allow_all) matchesPunjab = true;
        else if (u.preferred_states && Array.isArray(u.preferred_states)) {
            // Case insensitive check just in case
            matchesPunjab = u.preferred_states.some(s => s.toLowerCase() === 'punjab');
        }

        console.log(`- ${u.name}: AllowAll=${u.state_allow_all}, Prefs=[${u.preferred_states}]`);
        console.log(`  -> Matches 'Punjab'? ${matchesPunjab ? '✅ YES' : '❌ NO'}`);
    });
}

checkStates();
