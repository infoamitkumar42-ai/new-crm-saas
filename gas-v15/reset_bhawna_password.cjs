
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function resetPassword() {
    const email = 'bhawna1330@gmail.com';
    const newPassword = 'Bhawna123@';

    console.log(`🔐 Resetting Password for: ${email}...\n`);

    // 1. Get User ID from Auth
    const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers();

    if (listErr) { console.error("Error listing users:", listErr); return; }

    const user = users.find(u => u.email === email);

    if (!user) {
        console.log(`❌ User not found with email: ${email}`);
        return;
    }

    console.log(`✅ Found User: ${user.id}`);

    // 2. Update Password
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
        password: newPassword
    });

    if (error) {
        console.error(`❌ Error updating password:`, error.message);
    } else {
        console.log(`✅ Password Reset Successful!`);
        console.log(`   Email: ${email}`);
        console.log(`   New Password: ${newPassword}`);
    }
}

resetPassword();
