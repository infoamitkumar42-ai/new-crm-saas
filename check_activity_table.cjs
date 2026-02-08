
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function check() {
    console.log("🕵️ Checking USER_ACTIVITY View/Table...");

    const { data, error } = await supabase.from('user_activity').select('*').limit(5);

    if (error) {
        console.log("❌ Error accessing user_activity:", error.message);
    } else {
        console.log(`✅ Access Successful. Found ${data.length} rows.`);
        if (data.length > 0) console.log("   Sample:", data[0]);
    }
}

check();
