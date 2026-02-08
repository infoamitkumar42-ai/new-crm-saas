
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkTeamFire() {
    console.log("🕵️‍♂️ Checking TEAMFIRE Status...");

    // 1. Get Users
    const { data: users } = await supabase
        .from('users')
        .select('*')
        .eq('team_code', 'TEAMFIRE')
        .order('name');

    console.log(`\n👥 Team Fire Members (${users.length}):`);
    const tableData = users.map(u => ({
        Name: u.name,
        Active: u.is_active,
        Limit: u.daily_limit || 0,
        LeadsToday: u.leads_today || 0,
        Plan: u.plan_name,
        Expires: u.valid_until ? new Date(u.valid_until).toLocaleDateString() : 'N/A'
    }));

    console.table(tableData);

    // 2. Check Stuck Leads specifically for this team source
    const { count } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'New')
        .ilike('source', '%CBO%');

    console.log(`\n⚠️ Remaining Stuck Leads for TEAMFIRE: ${count}`);
}

checkTeamFire();
