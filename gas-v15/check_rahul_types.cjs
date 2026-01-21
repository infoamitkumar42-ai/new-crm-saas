
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTypes() {
    console.log("🕵️‍♀️ Checking Data Types for Rahul Rai...\n");

    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .ilike('name', '%Rahul Rai%');

    if (error) { console.error("Error:", error); return; }

    users.forEach(u => {
        console.log(`User: ${u.name}`);
        console.log(`  leads_today: ${u.leads_today} (Type: ${typeof u.leads_today})`);
        console.log(`  daily_limit: ${u.daily_limit} (Type: ${typeof u.daily_limit})`);

        // Test comparison
        const limit = u.daily_limit;
        const current = u.leads_today;

        console.log(`  Comparison (current >= limit): ${current >= limit}`);
        console.log(`  Is Limit String? ${typeof limit === 'string'}`);
    });
}

checkTypes();
