
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function finalReset() {
    const TARGET_ID = 'c4b380b5-495b-4b62-ac13-39940023662a';
    console.log(`🔐 Force Resetting Password for ID: ${TARGET_ID}`);

    const { data, error } = await supabase.auth.admin.updateUserById(TARGET_ID, {
        password: 'Akash123@#'
    });

    if (error) {
        console.error("❌ Failed:", error.message);
    } else {
        console.log("✅ SUCCESS! Password is now: Akash123@#");
        console.log("User Email:", data.user.email);
    }
}

finalReset();
