const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
    console.log("🔍 Checking user data for nikkibaljinderkaur@gmail.com...");

    const email = 'nikkibaljinderkaur@gmail.com';

    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (error) {
        console.error("Error fetching user:", error.message);
        return;
    }

    if (!user) {
        console.log("User not found in the database.");
    } else {
        console.log(`\nUser Details:`);
        console.log(`- Name: ${user.name}`);
        console.log(`- Team Code: ${user.team_code}`);
        console.log(`- Plan: ${user.plan_name}`);
        console.log(`- Is Active: ${user.is_active}`);
        console.log(`- Leads Today: ${user.leads_today}`);
        console.log(`- Daily Limit: ${user.daily_limit}`);
    }
}

main().catch(console.error);
