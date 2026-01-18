import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function forceAssign() {
    console.log('\n🚑 --- FORENSIC ASSIGNMENT: SWATI & SIMRAN ---\n');

    // Targets (From diagnostic output)
    const targets = [
        { name: 'Swati', id: '0e3b5d84-cf0d-4cc3-9237-3e6e42cbdfdd', needed: 5 },
        { name: 'Simran (Kamboj)', id: '3374d851-2b81-492c-8619-13a26e6360db', needed: 5 },
        { name: 'Simran (Simmi)', id: '5cca04ae-3d29-4efe-a12a-0b01336cddee', needed: 5 }
    ];

    // 1. Find Leads to Re-assign
    // Priority 1: Unassigned Leads created today
    // Priority 2: Leads assigned to 'Demo Account' or 'Test'

    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);

    // Get Unassigned first
    let { data: availableLeads, error } = await supabase
        .from('leads')
        .select('id, name, phone, assigned_to')
        .gt('created_at', startToday.toISOString())
        .is('assigned_to', null)
        .limit(50);

    if (availableLeads && availableLeads.length > 0) {
        console.log(`✅ Found ${availableLeads.length} Unassigned Leads to use.`);
    } else {
        console.log("⚠️ No Unassigned leads found. Checking 'Demo Account' & 'Test'...");

        // Find Demo/Test users
        const { data: sourceUsers } = await supabase
            .from('users')
            .select('id')
            .or('name.ilike.%Demo%,name.ilike.%Test%');

        if (sourceUsers && sourceUsers.length > 0) {
            const sourceIds = sourceUsers.map(u => u.id);
            const { data: stolenLeads } = await supabase
                .from('leads')
                .select('id, name, phone, assigned_to')
                .gt('created_at', startToday.toISOString())
                .in('assigned_to', sourceIds)
                .limit(50);

            if (stolenLeads) {
                console.log(`✅ Found ${stolenLeads.length} leads from Demo/Test accounts.`);
                availableLeads = stolenLeads;
            }
        }
    }

    if (!availableLeads || availableLeads.length === 0) {
        console.error("❌ CRITICAL: No leads available to re-assign! Check 'assigned_to' column manually.");
        return;
    }

    // 2. Distribute
    let leadIndex = 0;

    for (const target of targets) {
        console.log(`\n👉 Assigning to ${target.name} (Need ${target.needed})...`);
        let count = 0;

        while (count < target.needed && leadIndex < availableLeads.length) {
            const lead = availableLeads[leadIndex];
            leadIndex++;

            // Assign
            const { error: assignError } = await supabase
                .from('leads')
                .update({
                    assigned_to: target.id,
                    user_id: target.id,
                    status: 'Assigned',
                    assigned_at: new Date().toISOString()
                })
                .eq('id', lead.id);

            if (!assignError) {
                console.log(`   - Assigned Lead: ${lead.name} (${lead.phone})`);
                count++;
            } else {
                console.error(`   - Failed to assign lead ${lead.id}: ${assignError.message}`);
            }
        }

        // Update User Counter
        const { error: counterError } = await supabase
            .from('users')
            .update({ leads_today: count }) // Set to what we just gave (or add? assuming they had 0 real)
            .eq('id', target.id);

        if (!counterError) {
            console.log(`   ✅ User Counter Updated to: ${count}`);
        }
    }

    console.log("\n🎉 Assignment Fix Complete.");
}

forceAssign();
