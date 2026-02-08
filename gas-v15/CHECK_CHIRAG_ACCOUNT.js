import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkChiragAccount() {
    console.log('🔍 CHECKING CHIRAG ACCOUNT: cmdarji1997@gmail.com\n');

    // 1. Check if user exists
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'cmdarji1997@gmail.com')
        .single();

    if (error) {
        console.error('❌ User not found:', error.message);
        return;
    }

    console.log('✅ User Found:');
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Team: ${user.team_code}`);
    console.log(`   Active: ${user.is_active}`);
    console.log(`   Online: ${user.is_online}`);

    // 2. Check auth user
    const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();

    if (!authError) {
        const authUser = authUsers?.find(u => u.email === 'cmdarji1997@gmail.com');
        if (authUser) {
            console.log('\n✅ Auth User Found:');
            console.log(`   Confirmed: ${authUser.email_confirmed_at ? 'Yes' : 'No'}`);
            console.log(`   Last Sign In: ${authUser.last_sign_in_at || 'Never'}`);
        } else {
            console.log('\n❌ Auth user not found!');
        }
    }

    // 3. Test profile fetch (what app does)
    console.log('\n🧪 Testing Profile Fetch:');
    try {
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.log(`   ❌ Profile Fetch Failed: ${profileError.message}`);
        } else {
            console.log('   ✅ Profile Loads Successfully');
        }
    } catch (e) {
        console.log(`   ❌ Exception: ${e.message}`);
    }

    console.log('\n✅ DIAGNOSIS COMPLETE\n');
}

checkChiragAccount().catch(console.error);
