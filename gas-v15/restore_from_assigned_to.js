import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function restoreFromAssignedTo() {
    console.log('\n🔄 --- RESTORING FROM assigned_to FIELD ---\n');

    // Get all leads with assigned_to but no user_id
    const { data: leadsToRestore } = await supabase
        .from('leads')
        .select('id, assigned_to, name')
        .not('assigned_to', 'is', null)
        .is('user_id', null);

    console.log(`Found ${leadsToRestore.length} leads to restore\n`);

    if (leadsToRestore.length === 0) {
        console.log('✅ All leads with assigned_to are already restored!\n');
        return;
    }

    // Group by user
    const byUser = {};
    leadsToRestore.forEach(lead => {
        if (!byUser[lead.assigned_to]) {
            byUser[lead.assigned_to] = [];
        }
        byUser[lead.assigned_to].push(lead);
    });

    console.log(`Restoring leads for ${Object.keys(byUser).length} users...\n`);

    let totalRestored = 0;

    for (const [userId, leads] of Object.entries(byUser)) {
        // Restore user_id from assigned_to
        const { error } = await supabase
            .from('leads')
            .update({
                user_id: userId,
                status: 'Assigned'
            })
            .in('id', leads.map(l => l.id));

        if (!error) {
            totalRestored += leads.length;

            // Get user name
            const { data: user } = await supabase
                .from('users')
                .select('name')
                .eq('id', userId)
                .single();

            console.log(`✅ ${user?.name || 'User'}: Restored ${leads.length} leads`);

            // Update user counter
            await supabase
                .from('users')
                .update({ leads_today: leads.length })
                .eq('id', userId);
        }
    }

    console.log(`\n✅ RESTORATION COMPLETE!`);
    console.log(`   Total restored: ${totalRestored} leads\n`);
}

restoreFromAssignedTo();
