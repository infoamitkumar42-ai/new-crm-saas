
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function verifyIds() {
    console.log("🕵️ VERIFYING ID MISMATCH (Auth vs Public)...");

    const emails = ['info.amitkumar42@gmail.com', 'amitdemo1@gmail.com'];

    for (const email of emails) {
        console.log(`\nChecking ${email}...`);

        // 1. Get Auth ID
        const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
        const authUser = users.find(u => u.email === email);

        if (!authUser) {
            console.log("❌ NOT FOUND in Auth System (Login will fail)");
            continue;
        }

        console.log(`   🔑 Auth ID:   ${authUser.id}`);

        // 2. Get Public ID
        const { data: publicUser, error: dbError } = await supabase
            .from('users')
            .select('id, role')
            .eq('email', email)
            .single();

        if (dbError || !publicUser) {
            console.log("❌ NOT FOUND in Public Users Table (Profile Missing)");
        } else {
            console.log(`   👤 Public ID: ${publicUser.id}`);
            console.log(`   🛡️ Public Role: ${publicUser.role}`);

            if (authUser.id !== publicUser.id) {
                console.log("   🚨 MISMATCH DETECTED! Use `Sync Script` to fix.");
            } else {
                console.log("   ✅ IDs Match.");
            }
        }
    }
}

verifyIds();
