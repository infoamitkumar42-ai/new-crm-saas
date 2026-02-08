
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkConfig() {
    console.log("🕵️‍♂️ Checking Configuration for Akash...");

    const { data: user } = await supabase.from('users')
        .select('id, name, team_code, daily_limit, is_active, role')
        .eq('email', 'dbrar8826@gmail.com')
        .single();

    if (user) {
        console.log(`\n📋 CONFIG:`);
        console.log(`- Team Code: ${user.team_code}`);
        console.log(`- Daily Limit: ${user.daily_limit}`);
        console.log(`- Active: ${user.is_active}`);
        console.log(`- Role: ${user.role}`);

        // Check Team Performance comparison
        const { count } = await supabase.from('leads')
            .select('id', { count: 'exact', head: true })
            .eq('assigned_to', user.id)
            .gte('created_at', '2026-01-07');

        console.log(`- Leads since Jan 7: ${count}`);
    }
}

checkConfig();
