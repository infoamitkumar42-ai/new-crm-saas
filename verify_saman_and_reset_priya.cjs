const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    console.log('=== USER SUPPORT ACTIONS ===');

    // 1. Verify Samandeep
    console.log('\n--- Checking Samandeep ---');
    const { data: saman, error: samanError } = await supabase
        .from('users')
        .select('name, email, team_code, team_id')
        .eq('email', 'samandeepkaur1216@gmail.com')
        .single();

    if (samanError) console.error('❌ Saman Error:', samanError.message);
    else {
        console.log(`User: ${saman.name} (${saman.email})`);
        console.log(`Team Code: ${saman.team_code}`);
        // Double check if team is TEAMFIRE
        if (saman.team_code === 'TEAMFIRE') console.log('✅ Confirmed: Assigned to TEAMFIRE');
        else console.log(`⚠️ Warning: Assigned to ${saman.team_code}`);
    }

    // 2. Reset Priya's Password
    console.log('\n--- Resetting Priya\'s Password ---');
    const email = 'priyaarora50505@gmail.com';
    const newPassword = 'Priya123@';

    // Get User ID
    const { data: priya, error: priyaUserError } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('email', email)
        .single();

    if (priyaUserError) {
        console.error('❌ Priya Lookup Error:', priyaUserError.message);
        return;
    }

    console.log(`User Found: ${priya.name} (${priya.id})`);

    // Reset Password via Auth Admin
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
        priya.id,
        { password: newPassword }
    );

    if (updateError) {
        console.error('❌ Password Reset Failed:', updateError.message);
    } else {
        console.log(`✅ Password Reset Successful for ${email}`);
        console.log(`   New Password: ${newPassword}`);
    }

})();
