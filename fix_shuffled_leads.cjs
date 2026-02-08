
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const TEAM_CODE = 'GJ01TEAMFIRE';

async function restoreShuffledLeads() {
    console.log("🕵️ DETECTING PROBABLE SHUFFLED LEADS (Based on Activity History)...");

    // 1. Get Leads Updated Today (Potentially Shuffled)
    // We target leads assigned to Chirag's team today.
    const { data: teamMembers } = await supabase.from('users').select('id').eq('team_code', TEAM_CODE);
    const teamIds = teamMembers.map(u => u.id);

    // Limit query to recent 500 for safety / memory
    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, name, phone, assigned_to, users(name)')
        .in('assigned_to', teamIds)
        .gte('updated_at', '2026-02-06T00:00:00+05:30'); // Changed Today

    if (error) { console.error(error); return; }

    console.log(`Checking ${leads.length} recently active leads for shuffles...`);

    let restoreCount = 0;

    for (const lead of leads) {
        // 2. Check History (user_activity)
        // Find who interacted with this lead BEFORE today
        const { data: history } = await supabase
            .from('user_activity')
            .select('user_id, created_at')
            .eq('lead_id', lead.id)
            .lt('created_at', '2026-02-06T00:00:00+05:30') // Before Shuffle Event
            .order('created_at', { ascending: false })
            .limit(1); // Get Most Recent Owner

        if (history && history.length > 0) {
            const originalOwnerId = history[0].user_id;

            // 3. Compare with Current Owner
            if (originalOwnerId !== lead.assigned_to) {
                // SHUFFLE DETECTED!
                console.log(`⚠️ Lead ${lead.name} (${lead.phone})`);
                console.log(`   Current: ${lead.users ? lead.users.name : lead.assigned_to}`);
                console.log(`   Original (Activity): ${originalOwnerId}`);

                // 4. Restore
                const { error: restoreError } = await supabase
                    .from('leads')
                    .update({
                        assigned_to: originalOwnerId,
                        notes: (lead.notes || '') + '\n[System]: Restored to Original Owner.'
                    })
                    .eq('id', lead.id);

                if (!restoreError) {
                    console.log(`   ✅ RESTORED to Original Owner.`);
                    restoreCount++;
                } else {
                    console.log(`   ❌ Restore Failed: ${restoreError.message}`);
                }
            }
        }
    }

    console.log(`\n🎉 SCAN COMPLETE.`);
    console.log(`   Restored ${restoreCount} leads to their previous owners.`);
}

restoreShuffledLeads();
