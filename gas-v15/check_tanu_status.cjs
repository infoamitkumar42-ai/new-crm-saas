
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTanu() {
    console.log("🔍 Checking Tanu Dhawan (dhawantanu536@gmail.com)...\n");

    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'dhawantanu536@gmail.com');

    if (error) { console.error(error); return; }

    if (users.length > 0) {
        const u = users[0];
        console.log(`👤 Name: ${u.name}`);
        console.log(`   Leads Today (Counter): ${u.leads_today}`);
        console.log(`   Daily Limit: ${u.daily_limit}`);

        // Count Actuals
        const resetTime = '2026-01-17T18:30:00.000Z';
        const { count } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id)
            .gte('assigned_at', resetTime);

        console.log(`   Actual Leads: ${count}`);
    } else {
        console.log("❌ User not found");
    }
}

checkTanu();
