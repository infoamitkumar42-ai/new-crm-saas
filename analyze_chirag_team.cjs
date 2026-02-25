const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    console.log('--- TEAM ANALYSIS: GJ01TEAMFIRE ---');
    const { data: users } = await supabase.from('users').select('id, name, plan_name, role, leads_today').eq('team_code', 'GJ01TEAMFIRE').eq('is_active', true);

    // Group by Plan
    const breakdown = {};
    const nameMap = {};

    users.forEach(u => {
        nameMap[u.id] = u.name;
        // Normalize Plan Name
        let plan = (u.plan_name || 'starter').toLowerCase();
        if (plan === 'none' || !plan) plan = 'starter';

        if (!breakdown[plan]) breakdown[plan] = [];
        breakdown[plan].push({
            id: u.id,
            name: u.name,
            leads_today: u.leads_today
        });
    });

    console.log('--- TEAM COMPOSITION ---');
    Object.keys(breakdown).forEach(plan => {
        console.log(`\nPLAN: ${plan.toUpperCase()} (${breakdown[plan].length} Users)`);
        breakdown[plan].forEach(u => {
            console.log(`  - ${u.name} (Leads: ${u.leads_today})`);
        });
    });

    console.log('\n--- RECENT DISTRIBUTION (Last 30 mins) ---');
    const startTime = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    // Fetch leads assigned in last 30 mins (Should capture the 23 distributed)
    const { data: leads } = await supabase.from('leads')
        .select('assigned_to')
        .gte('assigned_at', startTime)
        .neq('status', 'Orphan');

    const distMap = {};
    if (leads && leads.length > 0) {
        leads.forEach(l => {
            if (!l.assigned_to) return;
            distMap[l.assigned_to] = (distMap[l.assigned_to] || 0) + 1;
        });

        console.log(`Total Leads Found in Window: ${leads.length}`);
        Object.entries(distMap).forEach(([id, count]) => {
            const name = nameMap[id] || id;
            console.log(`  - ${name}: +${count}`);
        });
    } else {
        console.log("No leads found in the last 30 mins.");
    }

    // Check Fatema's exact leads to reclaim
    if (nameMap['0d5d64b1-011c-4ee8-902a-de9ddca08115']) { // Fatema's ID
        const { data: fLeads } = await supabase.from('leads')
            .select('id, created_at, assigned_at')
            .eq('assigned_to', '0d5d64b1-011c-4ee8-902a-de9ddca08115')
            .gte('assigned_at', startTime) // Only recent ones
            .order('assigned_at', { ascending: false }); // Newest first

        console.log(`\n--- FATEMA RECENT LEADS ---`);
        console.log(`Total Recent: ${fLeads.length}`);
    }

})();
