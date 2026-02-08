import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.fMa7XroF8JDohNNzXjVO3qCgvJKYNd4a1wMy5ym8EBk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function simulateChiragLogin() {
    console.log('🔍 SIMULATING CHIRAG LOGIN FLOW\n');
    console.log('============================================\n');

    try {
        // Step 1: Try to sign in
        console.log('Step 1: Attempting sign in...');
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: 'cmdarji1997@gmail.com',
            password: 'Chirag@123'
        });

        if (authError) {
            console.error('❌ Auth Error:', authError.message);
            return;
        }

        console.log('✅ Auth successful!');
        console.log('   User ID:', authData.user.id);
        console.log('   Email:', authData.user.email);

        // Step 2: Try to fetch profile (what useAuth does)
        console.log('\nStep 2: Fetching user profile...');

        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (profileError) {
            console.error('❌ Profile Error:', profileError.message);
            console.error('   Code:', profileError.code);
            console.error('   Details:', profileError.details);
            console.error('   Hint:', profileError.hint);
            return;
        }

        if (!profile) {
            console.error('❌ Profile not found (returned null)');
            return;
        }

        console.log('✅ Profile loaded!');
        console.log('   Name:', profile.name);
        console.log('   Role:', profile.role);
        console.log('   Team:', profile.team_code);
        console.log('   Active:', profile.is_active);

        // Step 3: Check RLS policies
        console.log('\nStep 3: Testing RLS policies...');
        const { data: testQuery, error: rlsError } = await supabase
            .from('users')
            .select('id, name, email')
            .eq('id', authData.user.id)
            .single();

        if (rlsError) {
            console.error('❌ RLS Error:', rlsError.message);
        } else {
            console.log('✅ RLS policies working');
        }

        console.log('\n============================================');
        console.log('✅ LOGIN SIMULATION SUCCESSFUL');
        console.log('============================================\n');

    } catch (e) {
        console.error('\n❌ EXCEPTION:', e.message);
        console.error('Stack:', e.stack);
    }
}

simulateChiragLogin().catch(console.error);
