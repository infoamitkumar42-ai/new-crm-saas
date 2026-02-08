import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testChiragLogin() {
    console.log('🔍 TESTING CHIRAG TEAM LOGIN...\n');

    // Get a sample Chirag team member
    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('team_code', 'GJ01TEAMFIRE')
        .eq('is_active', true)
        .limit(5);

    if (error || !users || users.length === 0) {
        console.error('❌ No active users found');
        return;
    }

    console.log(`Found ${users.length} active users:\n`);

    for (const user of users) {
        console.log(`\n📧 ${user.name} (${user.email})`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.is_active}`);
        console.log(`   Team: ${user.team_code}`);

        // Simulate what useAuth does
        try {
            const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileError) {
                console.log(`   ❌ Profile Fetch Error: ${profileError.message}`);
            } else {
                console.log(`   ✅ Profile Loads Successfully`);
            }
        } catch (e) {
            console.log(`   ❌ Exception: ${e.message}`);
        }
    }

    console.log('\n✅ TEST COMPLETE\n');
}

testChiragLogin().catch(console.error);
