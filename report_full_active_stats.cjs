const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function generateFullReport() {
    console.log("📊 GENERATING FULL ACTIVE USER REPORT (Jan 31)...\n");

    // 1. Fetch All Active Users
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, plan_name, valid_until, total_leads_received, leads_today')
        .eq('is_active', true)
        .order('plan_name'); // Group by Plan

    if (error) return console.error(error);

    // Group Users by Plan
    const grouped = {};
    users.forEach(u => {
        const plan = u.plan_name || 'Unknown';
        if (!grouped[plan]) grouped[plan] = [];
        grouped[plan].push(u);
    });

    // 2. Process Each Plan Group
    for (const plan of Object.keys(grouped)) {
        console.log(`\n===============================================================`);
        console.log(`📌 PLAN: ${plan.toUpperCase()}`);
        console.log(`===============================================================`);
        console.log(`Name                 | Valid Until | Total Leads | 1st Pay | 2nd Pay`);
        console.log(`---------------------|-------------|-------------|---------|--------`);

        for (const u of grouped[plan]) {
            // Count 1st Payments
            const { count: firstPay } = await supabase
                .from('leads')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', u.id)
                .ilike('status', '%First Payment%');

            // Count 2nd Payments
            const { count: fullPay } = await supabase
                .from('leads')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', u.id)
                .ilike('status', '%Full Payment%');

            // Count Token Payments (Optional, merge with 1st?)
            // Let's stick to explicit 'First Payment' for now.

            const date = u.valid_until ? new Date(u.valid_until).toLocaleDateString() : 'N/A';
            const total = u.total_leads_received || 0;

            console.log(
                `${u.name.padEnd(20)} | ` +
                `${date.padEnd(11)} | ` +
                `${String(total).padEnd(11)} | ` +
                `${String(firstPay).padEnd(7)} | ` +
                `${String(fullPay).padEnd(6)}`
            );
        }
    }
}

generateFullReport();
