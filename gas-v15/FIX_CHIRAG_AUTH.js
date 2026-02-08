import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fixChiragAuth() {
    console.log('🔧 FIXING CHIRAG AUTH ACCOUNT\n');

    // Get user from database
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'cmdarji1997@gmail.com')
        .single();

    if (userError || !user) {
        console.error('❌ User not found in database');
        return;
    }

    console.log(`Found user: ${user.name} (${user.email})`);
    console.log(`User ID: ${user.id}\n`);

    // Check if auth user exists
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
    const existingAuth = authUsers?.find(u => u.email === user.email);

    if (existingAuth) {
        console.log('✅ Auth user already exists');
        console.log('   Just needs password reset probably\n');

        // Reset password
        const newPassword = 'Chirag@123';
        const { data, error } = await supabase.auth.admin.updateUserById(
            existingAuth.id,
            { password: newPassword }
        );

        if (error) {
            console.error('❌ Password reset failed:', error.message);
        } else {
            console.log(`✅ Password reset to: ${newPassword}`);
        }
    } else {
        console.log('⚠️ Auth user missing! Creating new one...\n');

        const newPassword = 'Chirag@123';

        // Create auth user with the SAME ID
        const { data, error } = await supabase.auth.admin.createUser({
            email: user.email,
            password: newPassword,
            email_confirm: true,
            user_metadata: {
                name: user.name,
                role: user.role
            }
        });

        if (error) {
            console.error('❌ Auth creation failed:', error.message);
        } else {
            console.log('✅ Auth user created!');
            console.log(`   Email: ${user.email}`);
            console.log(`   Password: ${newPassword}`);

            // Update the user ID in database if different
            if (data.user && data.user.id !== user.id) {
                console.log('\n⚠️ Warning: Auth ID different from DB ID');
                console.log(`   DB ID: ${user.id}`);
                console.log(`   Auth ID: ${data.user.id}`);
                console.log('   You may need to update the users table ID');
            }
        }
    }

    console.log('\n✅ FIX COMPLETE\n');
}

fixChiragAuth().catch(console.error);
