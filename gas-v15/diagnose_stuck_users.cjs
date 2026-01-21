
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseStuck() {
    console.log("🚑 Diagnosing Stalled Distribution...\n");

    // 1. Check Backlog (Are there leads to give?)
    const { count: pendingLeads, error: pErr } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'New');

    console.log(`📉 Pending Leads in Backlog: ${pendingLeads}`);

    if (pendingLeads === 0) {
        console.log("✅ CONCLUSION: No leads to distribute. System is waiting for new leads.");
        return;
    }

    // 2. Identify 'Stuck' Users (Active, Has Capacity, Low Count)
    const { data: users } = await supabase
        .from('users')
        .select('id, name, leads_today, daily_limit, filters')
        .eq('is_active', true)
        .lt('leads_today', 3) // Check people with 0, 1, 2
        .order('leads_today', { ascending: true })
        .limit(5);

    console.log(`\n👥 Sample 'Stuck' Users (${users.length} found):`);

    // 3. Check specific compatibility for the first few pending leads
    const { data: nextLeads } = await supabase
        .from('leads')
        .select('id, state, city')
        .eq('status', 'New')
        .limit(3);

    users.forEach(u => {
        const capacity = u.daily_limit - u.leads_today;
        const states = u.filters?.states || [];
        const isPanIndia = u.filters?.panIndia || u.filters?.pan_india;

        console.log(`   👤 ${u.name} (Leads: ${u.leads_today}/${u.daily_limit})`);
        console.log(`      States: ${isPanIndia ? 'ALL INDIA' : states.join(', ')}`);

        // Match against next leads
        let matches = 0;
        nextLeads.forEach(l => {
            const leadState = l.state || l.city || 'Unknown';
            const match = isPanIndia || states.some(s => leadState.toLowerCase().includes(s.toLowerCase()));
            if (match) matches++;
        });

        console.log(`      Start Matches in Next 3 Leads: ${matches}`);
    });
}

diagnoseStuck();
