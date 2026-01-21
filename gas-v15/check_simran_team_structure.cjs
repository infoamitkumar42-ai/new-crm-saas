
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

async function checkStructure() {
    console.log("🔍 Checking Structure for Simran (simran01@gmail.com)...");

    // 1. Find Simran
    const email = 'simran01@gmail.com';
    const { data: simran, error: simError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (simError || !simran) {
        console.error("❌ Simran Not Found:", simError ? simError.message : "No Data");

        // Fallback: Check similar
        console.log("   Checking for 'Simran' fuzzy match...");
        const { data: matches } = await supabase.from('users').select('name, email, id').ilike('name', '%Simran%');
        if (matches) matches.forEach(m => console.log(`   - Possible: ${m.name} (${m.email})`));
        return;
    }

    console.log(`\n👤 Simran Found:`);
    console.log(`   - ID: ${simran.id}`);
    console.log(`   - Manager ID: ${simran.manager_id}`);
    console.log(`   - Role: ${simran.role}`);

    // 2. Find Her Team (Where she is manager)
    const { data: team, error: teamError } = await supabase
        .from('users')
        .select('*')
        .eq('manager_id', simran.id)
        .eq('is_active', true);

    if (teamError) { console.error("❌ Team Error:", teamError); return; }

    console.log(`\n👥 Simran's Active Team (${team.length}):`);
    team.forEach(t => {
        const pending = (t.daily_limit || 0) - (t.leads_today || 0);
        console.log(`   - ${t.name}: ${t.leads_today}/${t.daily_limit} Leads (Pending: ${pending})`);
    });

    // 3. Find Himanshu
    const { data: himanshu } = await supabase.from('users').select('id, name').eq('id', '9dd68ace-a5a7-46d8-b677-3483b5bb0841').single();
    console.log(`\n👑 Himanshu (Page Owner): ${himanshu ? himanshu.name : 'Not Found'}`);
}

checkStructure();
