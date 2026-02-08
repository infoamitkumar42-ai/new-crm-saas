// Test with the ACTUAL anon key from config
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const REAL_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4';

const supabase = createClient(SUPABASE_URL, REAL_ANON_KEY);

async function testRealKey() {
    console.log('🔍 TESTING REAL ANON KEY FROM CONFIG\n');

    try {
        // Test simple query first
        console.log('Step 1: Testing basic connection...');
        const { data, error } = await supabase
            .from('users')
            .select('id')
            .limit(1);

        if (error) {
            console.error('❌ Connection Error:', error.message);
            console.error('   Code:', error.code);
            return;
        }

        console.log('✅ Connection works!\n');

        // Now try login
        console.log('Step 2: Attempting Chirag login...');
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: 'cmdarji1997@gmail.com',
            password: 'Chirag@123'
        });

        if (authError) {
            console.error('❌ Login Error:', authError.message);
            return;
        }

        console.log('✅ Login successful!');
        console.log('   User ID:', authData.user.id);

        // Fetch profile
        console.log('\nStep 3: Fetching profile...');
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (profileError) {
            console.error('❌ Profile Error:', profileError.message);
            console.error('   This is where the app is getting stuck!');
            return;
        }

        console.log('✅ Profile loaded successfully!');
        console.log('   Name:', profile.name);
        console.log('   Role:', profile.role);

        console.log('\n✅ ALL STEPS PASSED - NO ISSUE FOUND!');

    } catch (e) {
        console.error('\n❌ EXCEPTION:', e.message);
    }
}

testRealKey().catch(console.error);
