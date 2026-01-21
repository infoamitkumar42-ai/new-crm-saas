
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function bulkFixDates() {
    console.log("🛠 Bulk Updating Backlog Dates for ALL Users...\n");

    const resetTime = '2026-01-17T18:30:00.000Z'; // Midnight IST (Today Start)

    // 1. Find leads assigned TODAY but created BEFORE Today
    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, name, created_at, assigned_at, assigned_to')
        .gte('assigned_at', resetTime)  // Assigned Today
        .lt('created_at', resetTime);   // Created Yesterday or older

    if (error) { console.error("Fetch Error:", error); return; }

    console.log(`📋 Found ${leads.length} Older Leads Assigned Today.`);

    if (leads.length === 0) {
        console.log("✅ No backlog leads found. Everyone sees data correctly.");
        return;
    }

    // 2. Update them in batches
    console.log("🚀 Starting Update...");
    let updatedCount = 0;

    for (const lead of leads) {
        // Set Created At = Assigned At
        const newDate = lead.assigned_at;

        const { error: uErr } = await supabase
            .from('leads')
            .update({ created_at: newDate })
            .eq('id', lead.id);

        if (!uErr) {
            updatedCount++;
            process.stdout.write('.'); // Progress indicator
        } else {
            console.error(`❌ Data Error (${lead.name}):`, uErr.message);
        }
    }

    console.log(`\n\n✅ Success: Updated ${updatedCount} Leads.`);
    console.log("   These leads will now appear in 'Created Today' filters for all users.");
}

bulkFixDates();
