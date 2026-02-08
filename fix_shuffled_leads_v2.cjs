
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const TEAM_CODE = 'GJ01TEAMFIRE';

async function restoreShuffledLeads() {
    console.log("🕵️ DETECTING SHUFFLED LEADS (V2)...");

    const { data: teamMembers } = await supabase.from('users').select('id').eq('team_code', TEAM_CODE);
    const teamIds = teamMembers.map(u => u.id);

    // Fetch leads updated on Feb 6
    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, name, phone, assigned_to')
        .in('assigned_to', teamIds)
        .gte('updated_at', '2026-02-06T00:00:00+05:30');

    if (error) { console.error(error); return; }

    console.log(`Checking ${leads.length} leads...`);
    let restoreCount = 0;

    for (const lead of leads) {
        // Find Last Owner from History before today
        const { data: history } = await supabase
            .from('user_activity')
            .select('user_id')
            .eq('lead_id', lead.id)
            .lt('created_at', '2026-02-06T00:00:00+05:30')
            .order('created_at', { ascending: false })
            .limit(1);

        if (history && history.length > 0) {
            const originalOwnerId = history[0].user_id;

            if (originalOwnerId !== lead.assigned_to) {
                console.log(`⚠️ Shuffle: ${lead.name} -> Restore to ${originalOwnerId}`);

                const { error: restoreError } = await supabase
                    .from('leads')
                    .update({ assigned_to: originalOwnerId })
                    .eq('id', lead.id);

                if (!restoreError) { restoreCount++; }
            }
        }
    }

    console.log(`\n🎉 RESTORED ${restoreCount} LEADS.`);
}

restoreShuffledLeads();
