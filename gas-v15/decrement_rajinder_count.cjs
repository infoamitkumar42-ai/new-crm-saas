
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function decrementRajinder() {
    console.log("🛠 Adjusting Rajinder's Counter (Removing Shivansh)...\n");

    // 1. Get Current Count
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, leads_today, daily_limit')
        .eq('email', 'officialrajinderdhillon@gmail.com');

    if (error || !users.length) { console.error("❌ User not found or Error:", error); return; }
    const u = users[0];

    console.log(`👤 User: ${u.name}`);
    console.log(`   Current Count: ${u.leads_today}`);

    // 2. Decrement
    const newCount = Math.max(0, u.leads_today - 1);

    const { data: updated, error: uError } = await supabase
        .from('users')
        .update({ leads_today: newCount })
        .eq('id', u.id)
        .select();

    if (uError) { console.error("Update Failed:", uError); return; }

    console.log(`✅ Updated Count: ${updated[0].leads_today}`);
    console.log(`   Space Opened: 1 Lead`);
}

decrementRajinder();
