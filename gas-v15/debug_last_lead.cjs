
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugLastLead() {
    console.log("🔍 Debugging Last Lead Assignment...\n");

    // 1. Get Last Lead
    const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error || !leads.length) { console.error("No leads found.", error); return; }
    const lead = leads[0];

    console.log(`📦 Last Lead: ${lead.name}`);
    console.log(`   ID: ${lead.id}`);
    console.log(`   Created At: ${new Date(lead.created_at).toLocaleString()}`);
    console.log(`   Assigned To: ${lead.assigned_to}`);
    console.log(`   State: ${lead.state || 'N/A'}`);
    console.log(`   Manager ID (Lead Source): ${lead.manager_id}`); // If available
    console.log("------------------------------------------");

    if (lead.assigned_to) {
        // 2. Check Winner Details
        const { data: winner } = await supabase
            .from('users')
            .select('name, leads_today, daily_limit, filters')
            .eq('id', lead.assigned_to)
            .single();

        console.log(`🏆 Winner: ${winner.name}`);
        console.log(`   Stats (Current): ${winner.leads_today} Leads Assigned / ${winner.daily_limit} Limit`);
    } else {
        console.log("❌ Lead NOT Assigned (Stuck?)");
    }

    // 3. Check Tanu Details
    const { data: tanu } = await supabase
        .from('users')
        .select('name, leads_today, daily_limit, filters, manager_id')
        .eq('email', 'dhawantanu536@gmail.com')
        .single();

    console.log("------------------------------------------");
    console.log(`👤 Tanu Dhawan:`);
    console.log(`   Leads Today: ${tanu.leads_today}`);
    console.log(`   Daily Limit: ${tanu.daily_limit}`);
    console.log(`   Manager ID: ${tanu.manager_id}`);
    // Check State Compatibility
    const leadState = lead.state || '';
    const tanuStates = tanu.filters?.states || [];
    const isPanIndia = tanu.filters?.panIndia || tanu.filters?.pan_india;

    console.log(`   State Eligibility:`);
    console.log(`      Lead State: "${leadState}"`);
    console.log(`      Tanu Prefs: ${JSON.stringify(tanu.filters)}`);
    console.log(`      Match? ${isPanIndia || tanuStates.includes(leadState)}`);
}

debugLastLead();
