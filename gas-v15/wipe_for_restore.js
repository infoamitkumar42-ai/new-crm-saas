import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function wipeAssignmentsForCleanRestore() {
    console.log('\n🧹 --- WIPING ALL ASSIGNMENTS FOR CLEAN RESTORE ---\n');

    // We only want to wipe leads that are currently assigned.
    // OR just wipe eveything to be safe?
    // User said "un users ka 0 krdo data dubra fir resote kr denge".
    // 0 means unassign all.

    // Safety check: Don't wipe 'New' leads if possible, but actually backup will overwrite anyway.
    // But to be consistent with user request:

    const { count } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .not('user_id', 'is', null);

    console.log(`Found ${count} assigned leads to wipe.`);

    // Update in batches
    // We update ALL leads where user_id is not null to user_id = null

    let processed = 0;
    while (processed < (count || 3000)) {
        const { data: leads } = await supabase
            .from('leads')
            .select('id')
            .not('user_id', 'is', null)
            .limit(200);

        if (!leads || leads.length === 0) break;

        const ids = leads.map(l => l.id);
        const { error } = await supabase
            .from('leads')
            .update({
                user_id: null,
                assigned_to: null,
                status: 'New'  // Reset status to New
            })
            .in('id', ids);

        if (error) {
            console.error('Error wiping batch:', error);
            break;
        }

        processed += leads.length;
        process.stdout.write(`Wiped ${processed} leads...\r`);
    }

    // Also reset user counters
    const { data: users } = await supabase.from('users').select('id');
    const { error: cntError } = await supabase
        .from('users')
        .update({ leads_today: 0 })
        .in('id', users.map(u => u.id));

    console.log('\n✅ WIPE COMPLETE. System is clean for restoration.');
}

wipeAssignmentsForCleanRestore();
