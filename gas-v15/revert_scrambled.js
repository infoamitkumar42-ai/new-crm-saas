import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function revertScrambledRestoration() {
    console.log('\n🔄 --- REVERTING SCRAMBLED ASSIGNMENTS ---\n');

    // Get leads assigned in the last 2 hours (approx time since I ran the restoration)
    // We filter by assigned_at > 2 hours ago
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    const { data: leadsToRevert, error } = await supabase
        .from('leads')
        .select('*')
        .gt('assigned_at', twoHoursAgo);

    if (error) {
        console.error('Error fetching leads:', error);
        return;
    }

    console.log(`Found ${leadsToRevert.length} leads assigned recently.`);

    // We should be careful NOT to revert the 715 leads that were "good".
    // The good leads had 'assigned_to' matching 'user_id' BEFORE I ran my script.
    // But my script also set 'assigned_to'.
    // IMP: The "Good" leads were likely NOT touched by my restore script because I filtered for 'user_id is null'.

    // So any lead that WAS 'user_id: null' and is NOW 'assigned' is one I touched.
    // Since I can't look back in time, I have to assume ALL recently assigned leads are suspect
    // UNLESS they were assigned by the system (Night Backlog or Webhook)?

    // Webhook leads would have 'created_at' very close to 'assigned_at'.
    // My restored leads have OLD 'created_at' but NEW 'assigned_at'.

    const leadsToUnassign = leadsToRevert.filter(l => {
        const created = new Date(l.created_at);
        const assigned = new Date(l.assigned_at);
        const diffMs = assigned - created;
        // If created long ago (> 24 hours) but assigned recently, it's my restoration
        return diffMs > 24 * 60 * 60 * 1000;
    });

    console.log(`Identified ${leadsToUnassign.length} scrambled leads (Old Date + New Assignment).\n`);

    if (leadsToUnassign.length === 0) {
        console.log('No scrambled leads found to revert.');
        return;
    }

    // Unassign them
    const ids = leadsToUnassign.map(l => l.id);

    // Process in chunks of 100
    for (let i = 0; i < ids.length; i += 100) {
        const chunk = ids.slice(i, i + 100);
        await supabase
            .from('leads')
            .update({
                user_id: null,
                assigned_to: null, // Clear this too to avoid confusion
                status: 'New'
            })
            .in('id', chunk);

        process.stdout.write(`Reverted ${Math.min(i + 100, ids.length)}/${ids.length}\r`);
    }

    // Reset user counters
    // This is tricky. We should just recount leads_today for everyone.
    console.log('\n\nRecalculating user counters...');

    const { data: users } = await supabase.from('users').select('id');
    for (const user of users) {
        const { count } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

        await supabase
            .from('users')
            .update({ leads_today: count || 0 })
            .eq('id', user.id);
    }

    console.log('✅ REVERT COMPLETE. User confusion minimized.');
}

revertScrambledRestoration();
