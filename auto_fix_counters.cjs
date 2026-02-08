const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://vewqzsqddgmkslnuctvb.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDI3NzIyNiwiZXhwIjoyMDQ5ODUzMjI2fQ.LST6o4OQV55yp73knkZ5MlFH-2xXJjv0NlqCVzyyqTY',
    {
        auth: { autoRefreshToken: false, persistSession: false }
    }
);

async function fixCounters() {
    console.log('🔧 AUTOMATED COUNTER FIX - Starting...\n');
    console.log('='.repeat(70));

    try {
        // Step 1: Update counters to use user_id (dashboard method)
        console.log('\n📊 Step 1: Updating all user counters...');

        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, name, email, team_code')
            .in('team_code', ['TEAMFIRE', 'TEAMRAJ', 'GJ01TEAMFIRE']);

        if (usersError) {
            console.error('❌ Error fetching users:', usersError.message);
            return;
        }

        console.log(`Found ${users.length} users to update`);

        // Update each user's counter
        let updated = 0;
        for (const user of users) {
            // Count leads by user_id
            const { count } = await supabase
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

            // Update counter
            const { error: updateError } = await supabase
                .from('users')
                .update({ total_leads_received: count || 0 })
                .eq('id', user.id);

            if (!updateError) {
                updated++;
                if (updated % 10 === 0) {
                    console.log(`  Updated ${updated}/${users.length} users...`);
                }
            }
        }

        console.log(`✅ Updated ${updated} users successfully`);

        // Step 2: Verify sync
        console.log('\n📊 Step 2: Verifying sync status...');

        const syncCheck = await Promise.all(
            users.slice(0, 10).map(async (user) => {
                const { data: userData } = await supabase
                    .from('users')
                    .select('name, email, total_leads_received')
                    .eq('id', user.id)
                    .single();

                const { count } = await supabase
                    .from('leads')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id);

                return {
                    name: userData.name,
                    email: userData.email,
                    counter: userData.total_leads_received,
                    actual: count,
                    synced: userData.total_leads_received === count
                };
            })
        );

        console.log('\nTop 10 Users Sync Status:');
        console.table(syncCheck);

        const allSynced = syncCheck.every(u => u.synced);

        if (allSynced) {
            console.log('\n✅ SUCCESS! All counters synced with dashboard!');
        } else {
            console.log('\n⚠️ Some users still out of sync');
        }

        console.log('\n' + '='.repeat(70));
        console.log('🎯 NEXT STEP: Run UPDATE_INSERT_FUNCTION.sql manually');
        console.log('   This will fix future lead inserts to populate user_id');

    } catch (err) {
        console.error('\n❌ Error:', err.message);
    }
}

fixCounters();
