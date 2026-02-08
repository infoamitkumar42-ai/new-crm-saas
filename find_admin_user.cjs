
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function findAdmin() {
    console.log("🕵️ FINDING ADMIN USERS...");

    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, role, plan_name')
        .eq('role', 'admin');

    if (error) { console.error(error); return; }

    if (users.length === 0) {
        console.log("⚠️ NO ADMIN USER FOUND!");
    } else {
        console.log(`✅ Found ${users.length} Admin User(s):`);
        users.forEach(u => {
            console.log(`   👤 ${u.name} | 📧 ${u.email} | Role: ${u.role}`);
        });
    }
}

findAdmin();
