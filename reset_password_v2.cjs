
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const INPUT_EMAIL = 'nodhichetanchoksi@gmail.com'; // User provided (likely typo)
const AUTO_CORRECT_EMAIL = 'nidhichetanchoksi@gmail.com'; // Valid guess
const NEW_PASSWORD = 'Nidhi123@#';

async function resetPassword() {
    console.log(`🔐 SEARCHING USER TO RESET PASSWORD...`);

    // 1. Try Exact Match
    let { data: user } = await supabase.from('users').select('id, email').eq('email', INPUT_EMAIL).single();

    if (!user) {
        console.log(`❌ Exact match '${INPUT_EMAIL}' not found.`);
        console.log(`🔄 Trying auto-corrected '${AUTO_CORRECT_EMAIL}'...`);

        const { data: user2 } = await supabase.from('users').select('id, email').eq('email', AUTO_CORRECT_EMAIL).single();
        user = user2;
    }

    if (!user) {
        console.error("❌ User not found with either email.");
        return;
    }

    console.log(`👤 User Found: ${user.email} (ID: ${user.id})`);

    // 2. Update Password
    const { error: authError } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: NEW_PASSWORD }
    );

    if (authError) {
        console.error("❌ Failed to update password:", authError.message);
    } else {
        console.log(`✅ PASSWORD UPDATED SUCCESSFULLY!`);
        console.log(`📧 Email: ${user.email}`);
        console.log(`🔑 New Pass: ${NEW_PASSWORD}`);
    }
}

resetPassword();
