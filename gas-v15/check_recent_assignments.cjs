
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

async function checkRecent() {
    console.log("🔍 Checking Last 20 Assigned Leads...\n");

    // 1. Fetch Last 20 Assigned Leads
    const { data: leads, error: lError } = await supabase
        .from('leads')
        .select(`
            id, name, phone, assigned_at, 
            users!leads_assigned_to_fkey (name, leads_today, daily_limit)
        `)
        .eq('status', 'Assigned')
        .order('assigned_at', { ascending: false })
        .limit(20);

    if (lError) { console.error("❌ Error:", lError); return; }

    console.log(`📊 Recent Assignments (Newest First):`);
    console.log("----------------------------------------------------------------");

    leads.forEach(l => {
        const u = l.users;
        const pending = u ? (u.daily_limit - u.leads_today) : 'N/A';
        const rawTime = l.assigned_at;

        // Simple manual conversion if needed, or just show raw
        console.log(`[${rawTime}] (ID: ${l.id}) ${l.name} -> ${u ? u.name : 'Unknown'}`);
        if (u) console.log(`   Stats: ${u.leads_today}/${u.daily_limit} (Pending: ${pending})`);
    });

    console.log("----------------------------------------------------------------");
}

checkRecent();
