
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkIDs() {
    console.log("🔍 Resolving Manager IDs...\n");

    const ids = [
        '5c52c78f-6320-4a87-873b-5544d6731454', // From Code
        '79c67296-b221-4ca9-a3a5-1611e690e68d'  // From Navpreet Profile
    ];

    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, role')
        .in('id', ids);

    if (error) { console.error(error); return; }

    users.forEach(u => {
        console.log(`👤 Name: ${u.name}`);
        console.log(`   ID: ${u.id}`);
        console.log(`   Email: ${u.email}`);
        console.log(`   Role: ${u.role}`);
        console.log("---");
    });
}
checkIDs();
