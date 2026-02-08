import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function findAndFixChirag() {
    console.log('🔍 DEEP SEARCH FOR CHIRAG AUTH USER\n');

    // Get all auth users and search
    const { data: { users: allAuthUsers }, error } = await supabase.auth.admin.listUsers({
        perPage: 1000
    });

    if (error) {
        console.error('❌ Error listing users:', error.message);
        return;
    }

    console.log(`Total Auth Users: ${allAuthUsers?.length}\n`);

    // Search for chirag
    const chiragAuth = allAuthUsers?.filter(u =>
        u.email?.toLowerCase().includes('cmdarji') ||
        u.email?.toLowerCase().includes('chirag')
    );

    if (chiragAuth && chiragAuth.length > 0) {
        console.log(`Found ${chiragAuth.length} Chirag-related accounts:\n`);
        chiragAuth.forEach((u, i) => {
            console.log(`${i + 1}. ${u.email}`);
            console.log(`   ID: ${u.id}`);
            console.log(`   Confirmed: ${u.email_confirmed_at ? 'Yes' : 'No'}`);
            console.log(`   Last Sign In: ${u.last_sign_in_at || 'Never'}`);
            console.log('');
        });

        // Check if cmdarji1997@gmail.com specifically exists
        const exactMatch = chiragAuth.find(u => u.email === 'cmdarji1997@gmail.com');

        if (exactMatch) {
            console.log('✅ FOUND EXACT MATCH: cmdarji1997@gmail.com');
            console.log(`   Auth ID: ${exactMatch.id}`);

            // Get database user
            const { data: dbUser } = await supabase
                .from('users')
                .select('*')
                .eq('email', 'cmdarji1997@gmail.com')
                .single();

            if (dbUser) {
                console.log(`   DB ID: ${dbUser.id}`);

                if (exactMatch.id !== dbUser.id) {
                    console.log('\n⚠️ MISMATCH DETECTED!');
                    console.log('   Auth ID and DB ID are different!');
                    console.log('   This is why login fails!\n');

                    console.log('🔧 FIXING: Updating DB to match Auth ID...');

                    // Update users table to use correct Auth ID
                    const { error: updateError } = await supabase
                        .from('users')
                        .update({ id: exactMatch.id })
                        .eq('email', 'cmdarji1997@gmail.com');

                    if (updateError) {
                        console.error('❌ Update failed:', updateError.message);
                        console.log('\n📝 MANUAL FIX NEEDED:');
                        console.log(`   DELETE FROM users WHERE email = 'cmdarji1997@gmail.com';`);
                        console.log(`   Then let them sign up fresh with password reset`);
                    } else {
                        console.log('✅ ID updated successfully!');
                    }
                } else {
                    console.log('\n✅ IDs match! Should work fine.');
                    console.log('   Problem might be email not confirmed or password issue.');

                    // Reset password just in case
                    const newPassword = 'Chirag@123';
                    const { error: pwError } = await supabase.auth.admin.updateUserById(
                        exactMatch.id,
                        {
                            password: newPassword,
                            email_confirm: true
                        }
                    );

                    if (!pwError) {
                        console.log(`\n✅ Password reset to: ${newPassword}`);
                        console.log('   Email confirmed: Yes');
                    }
                }
            }
        } else {
            console.log('⚠️ Exact email not found among matches');
        }
    } else {
        console.log('❌ No Chirag accounts found in Auth system');
    }

    console.log('\n✅ SEARCH COMPLETE\n');
}

findAndFixChirag().catch(console.error);
