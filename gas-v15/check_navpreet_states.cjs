
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStates() {
    console.log("🔍 Checking State Prefs for Navpreet kaur...\n");

    const { data: users, error } = await supabase
        .from('users')
        .select(`
            name, email, 
            filters, target_state
        `)
        .eq('name', 'Navpreet kaur');

    if (error) { console.error(error); return; }

    users.forEach(u => {
        console.log(`👤 ${u.name}`);
        console.log(`   Filters: ${JSON.stringify(u.filters)}`);
        console.log(`   Target State Column: ${u.target_state}`);
        console.log("---");
    });
}
checkStates();
