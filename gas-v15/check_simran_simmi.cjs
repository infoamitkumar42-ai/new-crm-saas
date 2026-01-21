
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
    console.log("🔍 Checking User: simransimmi983@gmail.com...\n");

    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, manager_id, role')
        .eq('email', 'simransimmi983@gmail.com');

    if (error) { console.error(error); return; }

    if (users.length === 0) {
        console.log("❌ User NOT found!");
    } else {
        const u = users[0];
        console.log(`✅ Found User:`);
        console.log(`   Name: ${u.name}`);
        console.log(`   ID: ${u.id}`);
        console.log(`   Manager ID: ${u.manager_id}`);
        console.log(`   Role: ${u.role}`);
    }
}
checkUser();
