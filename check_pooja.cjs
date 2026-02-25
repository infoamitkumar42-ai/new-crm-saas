const { createClient } = require('@supabase/supabase-js');
// require('dotenv').config(); // Not needed as we use hardcoded keys

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkPooja() {
    console.log("🔍 Checking Pooja's Status...");
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'jollypooja5@gmail.com')
        .single();

    if (error) {
        console.error("❌ Error finding user:", error.message);
        return;
    }

    console.log("👤 User Details:");
    console.log(`- ID: ${user.id}`);
    console.log(`- Name: ${user.name}`);
    console.log(`- Team: ${user.team_code}`);
    console.log(`- Is Active: ${user.is_active}`);
    console.log(`- Plan: ${user.plan_name}`);
    console.log(`- Daily Limit: ${user.daily_limit}`);
    console.log(`- Total Received: ${user.total_leads_received}`);
    console.log(`- Total Promised: ${user.total_leads_promised}`);
    console.log(`- Valid Until: ${user.valid_until}`);
}

checkPooja();
