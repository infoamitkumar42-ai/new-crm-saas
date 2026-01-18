import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function recoverFromMetadata() {
    console.log('\n🔍 --- RECOVERING FROM temp_assigned_email ---\n');

    // Get orphan leads with temp_assigned_email
    const { data: orphansWithEmail } = await supabase
        .from('leads')
        .select('id, temp_assigned_email, name')
        .is('user_id', null)
        .not('temp_assigned_email', 'is', null);

    console.log(`Orphans with temp_assigned_email: ${orphansWithEmail.length}\n`);

    if (orphansWithEmail.length > 0) {
        console.log('Sample data:', orphansWithEmail.slice(0, 3));

        // Restore logic
        let restored = 0;

        // Get all users map (email -> id)
        const { data: users } = await supabase.from('users').select('id, email, name');
        const userMap = {};
        users.forEach(u => {
            if (u.email) userMap[u.email.toLowerCase().trim()] = u;
        });

        for (const lead of orphansWithEmail) {
            const email = lead.temp_assigned_email.toLowerCase().trim();
            const user = userMap[email];

            if (user) {
                const { error } = await supabase
                    .from('leads')
                    .update({
                        user_id: user.id,
                        status: 'Assigned',
                        assigned_to: user.id
                    })
                    .eq('id', lead.id);

                if (!error) {
                    restored++;
                    // Update counter
                    await supabase.rpc('increment_leads_today', { user_id: user.id });
                }
            } else {
                console.log(`⚠️ User not found for email: ${email}`);
            }
        }
        console.log(`\n✅ Restored ${restored} leads from temp_assigned_email!`);
    } else {
        console.log('❌ No orphan leads have temp_assigned_email data.');
    }
}

recoverFromMetadata();
