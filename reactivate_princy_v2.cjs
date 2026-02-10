const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const email = "princyrani303@gmail.com";

async function reactivatePrincy() {
    console.log(`🛠️ Reactivating Princy and doubling quota...`);

    // 1. Get User
    const { data: user } = await supabase.from('users').select('*').eq('email', email).single();
    if (!user) {
        console.log("User not found.");
        return;
    }

    const newPromised = 230; // 115 * 2

    // 2. Update User (Corrected columns)
    const { data, error } = await supabase
        .from('users')
        .update({
            total_leads_promised: newPromised,
            is_active: true,
            leads_today: 0 // Reset today's count to give her a fresh start
        })
        .eq('id', user.id)
        .select()
        .single();

    if (error) {
        console.error("❌ Update error:", error);
    } else {
        console.log(`✅ Success! Princy updated.`);
        console.log(`   - New Promised: ${data.total_leads_promised}`);
        console.log(`   - Received Already: ${data.total_leads_received}`);
        console.log(`   - Remaining Quota: ${data.total_leads_promised - data.total_leads_received}`);
        console.log(`   - Is Active: ${data.is_active}`);
    }
}

reactivatePrincy();
