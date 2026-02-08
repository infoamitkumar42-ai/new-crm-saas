
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function resetPass() {
    console.log("🔐 Resetting Password for Akash (dbrar8826@gmail.com)...");

    const email = 'dbrar8826@gmail.com';
    const newPass = 'Akash123@#';

    // 1. Get Auth User ID first (Reliable Way)
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    const target = users.find(u => u.email.toLowerCase() === email);

    if (target) {
        console.log(`✅ User Found in Auth DB. ID: ${target.id}`);

        // 2. Update Password
        const { error: resetErr } = await supabase.auth.admin.updateUserById(target.id, {
            password: newPass
        });

        if (!resetErr) {
            console.log("✅ SUCCESS! Password changed to: " + newPass);
            console.log("Please ask user to login now.");
        } else {
            console.error("❌ Reset Failed:", resetErr.message);
        }
    } else {
        console.error("❌ User NOT FOUND in Auth (Even though present in public.users).");
        console.log("   Legacy account issue? Try creating a new account if needed.");
    }
}

resetPass();
