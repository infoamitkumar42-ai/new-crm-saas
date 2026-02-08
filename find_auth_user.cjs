
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function findReset() {
    console.log("🔍 Searching Auth User: Dbrar8826@gmail.com...");

    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error("List Error:", error);
        return;
    }

    const target = users.find(u => u.email.toLowerCase() === 'dbrar8826@gmail.com');

    if (target) {
        console.log("✅ User Found in Auth System!");
        console.log("ID:", target.id);

        // RESET PASSWORD
        const { error: resetErr } = await supabase.auth.admin.updateUserById(target.id, {
            password: 'Akash123@#'
        });

        if (!resetErr) console.log("✅ Password RESET SUCCESS: Akash123@#");
        else console.error("❌ Reset Failed:", resetErr.message);

    } else {
        console.log("❌ User NOT FOUND in Auth Database.");
        console.log("   (Maybe typo? Listing similar emails...)");
        users.forEach(u => {
            if (u.email.includes("rar")) console.log("   - " + u.email);
        });
    }
}

findReset();
