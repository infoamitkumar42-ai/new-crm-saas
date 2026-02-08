
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function superPromote() {
    console.log("🦸‍♂️ SUPER PROMOTING 'amitdemo1@gmail.com'...");

    // 1. Find User ID
    const { data: users } = await supabase
        .from('users')
        .select('id')
        .eq('email', 'amitdemo1@gmail.com')
        .single();

    if (!users) {
        console.log("❌ User not found!");
        return;
    }
    const userId = users.id;

    // 2. Update DB Role
    await supabase.from('users').update({ role: 'admin', name: 'Amit (Super Admin)' }).eq('id', userId);
    console.log("✅ DB Role Updated to 'admin'.");

    // 3. Update Auth Metadata (The Failsafe)
    const { data, error } = await supabase.auth.admin.updateUserById(
        userId,
        { user_metadata: { role: 'admin' } }
    );

    if (error) {
        console.log("❌ Auth Metadata Update Failed:", error.message);
    } else {
        console.log("✅ Auth Metadata Updated to 'admin'.");
    }

    console.log("\n🔄 PLEASE LOG OUT AND LOG BACK IN.");
}

superPromote();
