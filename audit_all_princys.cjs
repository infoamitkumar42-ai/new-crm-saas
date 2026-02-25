const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    console.log('=== 🕵️ FINAL AUDIT: ALL PRINCYS ===');

    const { data: princys } = await supabase
        .from('users')
        .select('id, name, email, plan_name, total_leads_promised, total_leads_received, is_active')
        .ilike('name', '%princy%');

    if (princys) {
        console.log(`Found ${princys.length} users with "Princy" in name.`);
        princys.forEach(p => {
            const pending = (p.total_leads_promised || 0) - (p.total_leads_received || 0);
            console.log(`\n📌 ${p.name} (${p.email})`);
            console.log(`   Pending: ${pending} (${p.total_leads_received}/${p.total_leads_promised})`);
            console.log(`   Plan: ${p.plan_name}`);
            console.log(`   Active: ${p.is_active}`);
            // If this is the heavy one (462), we need to explain.
            if (pending > 300) {
                console.log(`   🚨 HIGH USAGE ANOMALY!`);
            }
        });
    }
})();
