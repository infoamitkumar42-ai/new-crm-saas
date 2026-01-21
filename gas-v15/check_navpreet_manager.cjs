
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkManager() {
    console.log("🔍 Checking Manager for Navpreet kaur & Rahul Rai...\n");

    // Check Navpreet and Rahul
    const { data: users, error } = await supabase
        .from('users')
        .select(`
            name, email, manager_id,
            manager:manager_id (name)
        `)
        .in('name', ['Navpreet kaur', 'Rahul Rai']);

    if (error) { console.error(error); return; }

    users.forEach(u => {
        console.log(`👤 ${u.name}`);
        console.log(`   Manager ID: ${u.manager_id}`);
        // Log manager name if resolved, else null
        // Note: Supabase structure returns array or object depending on relationship, debug log
        console.log(`   Manager Name: ${u.manager?.name || 'Unknown'}`);
        console.log("---");
    });
}
checkManager();
