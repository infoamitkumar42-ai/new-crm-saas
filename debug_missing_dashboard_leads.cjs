
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const TARGET_EMAIL = 'jk419473@gmail.com';

async function debugVisibility() {
    console.log(`🕵️‍♂️ DEBUGGING DASHBOARD VISIBILITY for ${TARGET_EMAIL}...\n`);

    // 1. Get User
    const { data: user } = await supabase.from('users').select('*').eq('email', TARGET_EMAIL).single();
    if (!user) return console.log("❌ User not found.");

    console.log(`👤 User: ${user.name} (ID: ${user.id})`);
    console.log(`📊 Admin Says: ${user.leads_today} Leads Today`);

    // 2. Fetch Leads assigned TODAY
    const today = new Date().toISOString().split('T')[0];
    const { data: leads } = await supabase.from('leads')
        .select('id, name, created_at, status, assigned_at')
        .eq('assigned_to', user.id)
        .gte('created_at', today + 'T00:00:00'); // Validating using Created At

    console.log(`\n🔍 DB SEARCH (created_at >= Today): Found ${leads.length} leads.`);

    if (leads.length > 0) {
        console.table(leads);
    } else {
        console.log("   ❌ NO LEADS FOUND with today's 'created_at'.");
        console.log("   checking 'assigned_at' instead...");

        // Fallback check: Assigned Today but Created Earlier?
        const { data: assignedLeads } = await supabase.from('leads')
            .select('id, name, created_at, status, assigned_at')
            .eq('assigned_to', user.id)
            .gte('assigned_at', today + 'T00:00:00');

        console.log(`   🔍 DB SEARCH (assigned_at >= Today): Found ${assignedLeads.length} leads.`);
        if (assignedLeads.length > 0) console.table(assignedLeads);
    }

    // 3. WIDE Check for ANY user having this mismatch
    console.log("\n🌍 SCANNING ALL USERS FOR MISMATCH (Admin vs Real)...");

    // Get all users with leads_today > 0
    const { data: activeUsers } = await supabase.from('users')
        .select('id, name, leads_today')
        .gt('leads_today', 0);

    let mismatchCount = 0;

    for (const u of activeUsers) {
        // Count actual leads in DB created today
        const { count } = await supabase.from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id)
            .gte('created_at', today + 'T00:00:00');

        if (count !== u.leads_today) {
            console.log(`⚠️ MISMATCH: ${u.name} | Admin Says: ${u.leads_today} | DB Has: ${count}`);
            mismatchCount++;
        }
    }

    if (mismatchCount === 0) console.log("✅ ALL SYNCED. No mismatches found globally.");
}

debugVisibility();
