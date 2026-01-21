
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixCounter() {
    console.log("🛠 Correcting Rajinder's Counter...\n");

    // Set leads_today = 2
    const { data, error } = await supabase
        .from('users')
        .update({ leads_today: 2 })
        .eq('email', 'officialrajinderdhillon@gmail.com')
        .select();

    if (error) { console.error(error); return; }

    if (data.length > 0) {
        console.log(`✅ Success! Updated ${data[0].name}:`);
        console.log(`   New Leads Today: ${data[0].leads_today}`);
        console.log(`   Daily Limit: ${data[0].daily_limit}`);
        console.log(`   Pending Capacity: ${data[0].daily_limit - data[0].leads_today}`);
    } else {
        console.log("❌ User not found.");
    }
}

fixCounter();
