
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function check() {
    console.log("🕵️ Checking Role for user 'Amit'...");

    // Search for Amit
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, role, payment_status')
        .ilike('name', '%Amit%'); // Loose search

    if (error) {
        console.log("❌ Error fetching users:", error.message);
        return;
    }

    if (users && users.length > 0) {
        console.table(users);
        const admin = users.find(u => u.role === 'admin' || u.role === 'manager');
        if (admin) {
            console.log(`✅ FOUND ADMIN/MANAGER: ${admin.name} (${admin.role})`);
        } else {
            console.log("⚠️ No Admin/Manager found with name 'Amit'. All are 'member'?");
        }
    } else {
        console.log("❌ No user found named Amit.");
    }
}

check();
