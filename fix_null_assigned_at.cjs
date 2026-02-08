
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function fixAssignedAt() {
    console.log("🚑 EMERGENCY FIX: Setting 'assigned_at' for invisible leads...\n");

    const today = new Date().toISOString().split('T')[0];

    // 1. Find Leads created Today but have NULL assigned_at
    const { data: leads } = await supabase.from('leads')
        .select('id, created_at, assigned_to')
        .gte('created_at', today + 'T00:00:00')
        .is('assigned_at', null);

    if (!leads || leads.length === 0) return console.log("✅ No invisible leads found.");

    console.log(`⚠️ Found ${leads.length} leads with Missing Assignment Time.`);
    console.log("   (These are the ones hidden from dashboard)");

    let fixedCount = 0;

    // 2. Fix them one by one (copy created_at -> assigned_at)
    for (const l of leads) {
        if (!l.assigned_to) continue; // Skip unassigned

        const { error } = await supabase.from('leads')
            .update({ assigned_at: l.created_at })
            .eq('id', l.id);

        if (!error) fixedCount++;
    }

    console.log(`\n✅ FIXED: ${fixedCount} Leads are now visible.`);
}

fixAssignedAt();
