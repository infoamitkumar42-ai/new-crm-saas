
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function promote() {
    console.log("🚀 PROMOTING 'Amit' USERS TO ADMIN...");

    // 1. Promote 'amitdemo1@gmail.com' (The most likely candidate for 'AMIT')
    const { data: u1, error: e1 } = await supabase
        .from('users')
        .update({ role: 'admin', payment_status: 'active', plan_name: 'manager' })
        .eq('email', 'amitdemo1@gmail.com')
        .select();

    if (u1 && u1.length) console.log(`✅ Promoted amitdemo1@gmail.com (Name: ${u1[0].name}) to ADMIN.`);
    else console.log("⚠️ Could not find/update amitdemo1@gmail.com");

    // 2. Promote 'info.amitkumar42@gmail.com' (The real admin)
    const { data: u2, error: e2 } = await supabase
        .from('users')
        .update({ role: 'admin', payment_status: 'active' })
        .eq('email', 'info.amitkumar42@gmail.com')
        .select();

    if (u2 && u2.length) console.log(`✅ Promoted info.amitkumar42@gmail.com (Name: ${u2[0].name}) to ADMIN.`);

    console.log("\n🔄 PLEASE REFRESH YOUR BROWSER NOW.");
}

promote();
