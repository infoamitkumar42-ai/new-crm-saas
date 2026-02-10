const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function resetPassword() {
    const email = "Jashanpreet0479@gmail.com";
    const newPassword = "Jashan123@#";

    console.log(`🔐 Attempting to reset password for: ${email}`);

    try {
        // 1. Get user by email
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) throw listError;

        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!user) {
            console.error(`❌ User not found in Auth!`);
            return;
        }

        console.log(`👤 Found User ID: ${user.id}`);

        // 2. Update password
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            user.id,
            { password: newPassword }
        );

        if (updateError) throw updateError;

        console.log(`✅ Success! Password has been reset to: ${newPassword}`);
    } catch (error) {
        console.error("❌ Reset Failed:", error.message);
    }
}

resetPassword();
