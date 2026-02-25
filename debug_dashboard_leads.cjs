const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://vewqzsqddgmkslnuctvb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us');

async function main() {
    // 1. Check RLS policies on leads table
    const { data: rls } = await supabase.rpc('exec_sql', {
        sql: "SELECT polname, polcmd, pg_get_expr(polqual, polrelid) as qual FROM pg_policy WHERE polrelid = 'leads'::regclass"
    });
    console.log("=== RLS POLICIES ON LEADS TABLE ===");
    console.log(JSON.stringify(rls, null, 2));

    // 2. Check a few users' leads_today counter vs actual leads today
    const testUsers = [
        'dhawantanu536@gmail.com',       // Tanu
        'harmandeepkaurmanes790@gmail.com', // Harmandeep
        'dbrar8826@gmail.com'             // Akash
    ];

    console.log("\n=== LEADS_TODAY COUNTER vs ACTUAL TODAY LEADS ===");
    for (const email of testUsers) {
        const { data: u } = await supabase.from('users').select('id, name, leads_today, daily_limit').eq('email', email);
        if (!u || !u.length) continue;

        const { count } = await supabase.from('leads').select('*', { count: 'exact', head: true })
            .eq('user_id', u[0].id)
            .gte('created_at', '2026-02-22T18:30:00Z'); // Today IST

        console.log(`${u[0].name} (${email}):`);
        console.log(`  leads_today counter: ${u[0].leads_today} | daily_limit: ${u[0].daily_limit}`);
        console.log(`  Actual today leads in DB: ${count}`);
    }

    // 3. Check the RPC function that dashboard uses
    const { data: rpcDef } = await supabase.rpc('exec_sql', {
        sql: "SELECT prosrc FROM pg_proc WHERE proname = 'get_user_leads'"
    });
    console.log("\n=== get_user_leads RPC ===");
    console.log(JSON.stringify(rpcDef, null, 2));

    // 4. count all reassigned leads from our script
    const { count: reassignedCount } = await supabase.from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('assigned_at', '2026-02-23T10:20:00Z')
        .lt('assigned_at', '2026-02-23T11:30:00Z')
        .eq('status', 'Assigned');
    console.log("\nTotal reassigned leads in that time window:", reassignedCount);
}

main().catch(e => console.log('Error:', e.message));
