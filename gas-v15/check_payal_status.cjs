
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPayal() {
    console.log("🔍 Checking Payal Puri (payalpuri3299@gmail.com)...\n");

    // 1. Get User Details
    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'payalpuri3299@gmail.com');

    if (error) { console.error(error); return; }

    if (users.length > 0) {
        const u = users[0];
        console.log(`👤 Name: ${u.name}`);
        console.log(`   Leads Today (Counter): ${u.leads_today}`);
        console.log(`   Daily Limit: ${u.daily_limit}`);
        console.log(`   Manager ID: ${u.manager_id}`);

        // 2. Count Actual Leads
        const resetTime = '2026-01-17T18:30:00.000Z';
        const { data: leads, error: lError } = await supabase
            .from('leads')
            .select('*')
            .eq('assigned_to', u.id)
            .gte('assigned_at', resetTime)
            .order('assigned_at', { ascending: false });

        if (lError) { console.error("Lead Error:", lError); return; }

        console.log(`   Actual Leads Found: ${leads.length}`);
        leads.forEach(l => {
            console.log(`   - [${new Date(l.assigned_at).toLocaleString()}] ${l.name}`);
        });

    } else {
        console.log("❌ User not found");
    }
}

checkPayal();
