
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPayalDates() {
    console.log("🛠 Updating Payal's Backlog Leads to 'Today'...\n");

    // 1. Get User
    const { data: users } = await supabase.from('users').select('id').eq('email', 'payalpuri3299@gmail.com');
    if (!users.length) return;
    const userId = users[0].id;

    // 2. Identify Target Leads (Assigned Today, Created < Today)
    const resetTime = '2026-01-17T18:30:00.000Z'; // Midnight IST

    // We specifically target the 7 backlog leads identified
    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, name, created_at, assigned_at')
        .eq('assigned_to', userId)
        .gte('assigned_at', resetTime)
        .lt('created_at', resetTime); // Created BEFORE today

    if (error) { console.error("Fetch Error:", error); return; }

    console.log(`📋 Found ${leads.length} Backlog Leads to Update.`);

    // 3. Update Them
    for (const lead of leads) {
        // Set Created At = Assigned At (Matches "Today" view)
        const newDate = lead.assigned_at;

        const { error: uErr } = await supabase
            .from('leads')
            .update({ created_at: newDate })
            .eq('id', lead.id);

        if (!uErr) {
            console.log(`   ✅ Updated: ${lead.name}`);
        } else {
            console.log(`   ❌ Failed: ${lead.name}`);
        }
    }
}

fixPayalDates();
