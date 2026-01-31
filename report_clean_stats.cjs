const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function generateCleanReport() {
    console.log("📊 ACTIVE PAID USER REPORT (Jan 31)...\n");

    // Fetch Only Active Paid Users
    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('is_active', true)
        .neq('plan_name', 'none')
        .order('plan_name', { ascending: true });

    if (error) return console.error(error);

    const grouped = {};
    users.forEach(u => {
        const plan = u.plan_name || 'Unknown';
        if (!grouped[plan]) grouped[plan] = [];
        grouped[plan].push(u);
    });

    for (const plan of Object.keys(grouped)) {
        console.log(`\n===============================================================`);
        console.log(`📌 PLAN: ${plan.toUpperCase()}`);
        console.log(`===============================================================`);
        console.log(`Name                 | Valid Until | Leads(Life)| Replacements | 1st Pay `);
        console.log(`---------------------|-------------|------------|--------------|---------`);

        for (const u of grouped[plan]) {
            const { count: firstPay } = await supabase
                .from('leads')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', u.id)
                .ilike('status', '%Payment%'); // Broad match for any payment

            const date = u.valid_until ? new Date(u.valid_until).toLocaleDateString() : 'Lifetime';
            const lifeLeads = String(u.total_leads_received).padEnd(10);
            const repl = `${u.replacement_count}/${u.max_replacements || 0}`.padEnd(12);

            console.log(
                `${u.name.slice(0, 19).padEnd(20)} | ` +
                `${date.padEnd(11)} | ` +
                `${lifeLeads} | ` +
                `${repl} | ` +
                `${firstPay}`
            );
        }
    }
}

generateCleanReport();
