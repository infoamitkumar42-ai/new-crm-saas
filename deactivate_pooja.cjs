const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function deactivatePooja() {
    console.log("🛑 DEACTIVATING POOJA JOLLY...");

    const email = 'jollypooja5@gmail.com';

    const { error } = await supabase
        .from('users')
        .update({
            is_active: false,
            daily_limit: 0,
            valid_until: null // Clear validity
        })
        .eq('email', email);

    if (error) {
        console.error("❌ Error deactivating:", error.message);
    } else {
        console.log("✅ SUCCESS! User Stopped.");
        console.log("   - is_active: false");
        console.log("   - daily_limit: 0");
    }
}

deactivatePooja();
