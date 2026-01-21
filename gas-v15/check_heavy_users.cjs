
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkHeavyUsers() {
    console.log("🔍 Checking Today's Leads for Navpreet & Rahul...\n");

    // Reset Time: 2026-01-17 18:30:00 UTC (Today 00:00 IST)
    const resetTime = '2026-01-17T18:30:00.000Z';

    // Names to check
    const names = ['Navpreet kaur', 'Rahul Rai'];

    const { data: users, error } = await supabase
        .from('users')
        .select('id, name')
        .in('name', names);

    if (error) { console.error(error); return; }

    for (const u of users) {
        console.log(`👤 Checking: ${u.name}`);

        const { data: leads, error: lError } = await supabase
            .from('leads')
            .select('id, name, assigned_at')
            .eq('assigned_to', u.id)
            .gte('assigned_at', resetTime)
            .order('assigned_at', { ascending: false });

        if (lError) { console.error(lError); continue; }

        console.log(`   🔥 Total Leads Today: ${leads.length}`);

        // Show first 5 and last 5 for context
        if (leads.length > 0) {
            console.log(`   First Lead (Latest): ${new Date(leads[0].assigned_at).toLocaleString()}`);
            console.log(`   Last Lead (Earliest): ${new Date(leads[leads.length - 1].assigned_at).toLocaleString()}`);
        }
        console.log("------------------------------------------");
    }
}

checkHeavyUsers();
