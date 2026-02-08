
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function fixAdmin() {
    console.log("👑 FIXING ADMIN ACCOUNT: info.amitkumar42@gmail.com");

    // Update Role, Status, and Name to be clear
    const { data, error } = await supabase
        .from('users')
        .update({
            role: 'admin',
            payment_status: 'active',
            plan_name: 'manager', // Gives full access
            name: 'Amit (Admin)'  // Explicit name to avoid confusion
        })
        .eq('email', 'info.amitkumar42@gmail.com')
        .select();

    if (error) {
        console.log("❌ Error:", error.message);
    } else {
        console.log("✅ SUCCESS! Account updated:");
        console.table(data);
        console.log("\n👇 INSTRUCTIONS:");
        console.log("1. LOG OUT completely.");
        console.log("2. LOG IN with 'info.amitkumar42@gmail.com'.");
        console.log("3. You should see 'Amit (Admin)' and the ADMIN DASHBOARD.");
    }
}

fixAdmin();
