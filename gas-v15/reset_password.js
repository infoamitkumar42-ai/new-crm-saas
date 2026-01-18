import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const TARGET_EMAIL = 'diljots027@gmail.com';
const NEW_PASSWORD = 'Preet123@';

async function resetPassword() {
    console.log(`🔍 Finding user: ${TARGET_EMAIL}...`);

    // 1. Get User ID from public users table (assuming it mirrors auth.users)
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name')
        .eq('email', TARGET_EMAIL)
        .single();

    if (userError || !userData) {
        console.error('❌ User not found in public table:', userError?.message);
        // Fallback: Try to list users via admin api (expensive but accurate)
        // Or just fail.
        return;
    }

    const userId = userData.id;
    console.log(`✅ Found User: ${userData.name} (ID: ${userId})`);

    // 2. Update Password via Admin API
    console.log(`🔄 Resetting password...`);

    // Note: supabase.auth.admin is available with service role key
    const { data, error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        { password: NEW_PASSWORD }
    );

    if (updateError) {
        console.error('❌ Failed to update password:', updateError.message);
    } else {
        console.log(`🎉 Password updated successfully for ${TARGET_EMAIL}`);
        console.log(`🔑 New Password: ${NEW_PASSWORD}`);
    }
}

resetPassword();
