const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
    // Fetch ALL TEAMFIRE users (active + inactive)
    const { data: allUsers } = await supabase.from('users')
        .select('id, name, email, is_active')
        .eq('team_code', 'TEAMFIRE')
        .order('name');

    const userIds = allUsers.map(u => u.id);

    // Fetch ALL captured payments
    let allPayments = [];
    for (let i = 0; i < userIds.length; i += 50) {
        const batch = userIds.slice(i, i + 50);
        const { data } = await supabase.from('payments')
            .select('user_id')
            .eq('status', 'captured')
            .in('user_id', batch);
        if (data) allPayments = allPayments.concat(data);
    }

    const paidUserIds = new Set(allPayments.map(p => p.user_id));

    // Find users with 0 payments but leads > 0
    const freeLoaders = [];
    let totalFreeLeads = 0;

    for (const u of allUsers) {
        if (paidUserIds.has(u.id)) continue; // Has payment, skip

        const { count } = await supabase.from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id);

        if (count > 0) {
            freeLoaders.push({
                name: u.name,
                email: u.email,
                active: u.is_active ? 'ACTIVE' : 'STOPPED',
                leads: count
            });
            totalFreeLeads += count;
        }
    }

    freeLoaders.sort((a, b) => b.leads - a.leads);

    console.log("=============================================================================");
    console.log("TEAMFIRE - FREE LEADS REPORT (Users with 0 Payments but Got Leads)");
    console.log("=============================================================================\n");
    console.log(`Total such users: ${freeLoaders.length}`);
    console.log(`Total FREE leads given: ${totalFreeLeads}\n`);

    freeLoaders.forEach((u, i) => {
        console.log(`${i + 1}. ${u.name} (${u.email}) [${u.active}] -> ${u.leads} leads`);
    });

    console.log(`\n=============================================================================`);
    console.log(`TOTAL: ${freeLoaders.length} users received ${totalFreeLeads} leads for FREE`);
    console.log(`=============================================================================`);
}

main().catch(console.error);
