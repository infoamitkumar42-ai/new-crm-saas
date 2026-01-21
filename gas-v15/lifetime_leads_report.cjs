
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function getLifetimeReport() {
    console.log("📊 LIFETIME LEADS REPORT (All Users)\n");
    console.log("=".repeat(70));

    // Get all active users
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, plan_name, total_leads_promised, valid_until')
        .eq('is_active', true);

    if (error) { console.error("Err:", error); return; }

    const results = [];

    // Count lifetime leads for each user
    for (const u of users) {
        const { count } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id);

        const lifetimeLeads = count || 0;
        const planPromised = u.total_leads_promised || 0;

        results.push({
            name: u.name,
            plan: u.plan_name,
            promised: planPromised,
            lifetime: lifetimeLeads,
            validUntil: u.valid_until ? new Date(u.valid_until).toLocaleDateString() : 'N/A'
        });
    }

    // Sort by lifetime leads (most first)
    results.sort((a, b) => b.lifetime - a.lifetime);

    // Print top users
    console.log(`| #  | Name                 | Plan       | Lifetime Leads | Valid Until   |`);
    console.log("-".repeat(80));

    results.slice(0, 30).forEach((u, i) => {
        console.log(`| ${String(i + 1).padStart(2)} | ${u.name.padEnd(20)} | ${(u.plan || 'N/A').padEnd(10)} | ${String(u.lifetime).padEnd(14)} | ${u.validUntil} |`);
    });

    if (results.length > 30) {
        console.log(`| ... and ${results.length - 30} more users |`);
    }

    // Summary
    const totalLifetime = results.reduce((sum, u) => sum + u.lifetime, 0);
    console.log(`\n${"=".repeat(70)}`);
    console.log(`📈 SUMMARY:`);
    console.log(`   Total Users:          ${results.length}`);
    console.log(`   Total Lifetime Leads: ${totalLifetime}`);
    console.log(`${"=".repeat(70)}`);
}

getLifetimeReport();
