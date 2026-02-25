const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
    const { data: users } = await supabase
        .from('users')
        .select('id, name, plan_name, leads_today')
        .eq('team_code', 'TEAMFIRE')
        .eq('is_active', true)
        .order('leads_today', { ascending: false });

    let total = 0;
    console.log(`Active TEAMFIRE Users: ${users.length}\n`);
    users.forEach(u => {
        total += (u.leads_today || 0);
        console.log(`  ${u.name} (${u.plan_name}): ${u.leads_today || 0} leads today`);
    });
    console.log(`\n🔥 TOTAL LEADS ASSIGNED TODAY to TEAMFIRE: ${total}`);
}

main().catch(console.error);
