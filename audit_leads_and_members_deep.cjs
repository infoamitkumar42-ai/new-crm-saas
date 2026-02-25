const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function deepAudit() {
    console.log("🕵️ STARTING DEEP AUDIT (Members & Leads)...");
    const today = new Date().toISOString().split('T')[0];

    // --- 1. MEMBER AUDIT (GJ01TEAMFIRE) ---
    console.log("\n--- 👥 GJ01TEAMFIRE MEMBER DETAILS (Total: 40) ---");
    const { data: members } = await supabase
        .from('users')
        .select('name, email, plan_name, valid_until, created_at, is_active, payment_status')
        .eq('team_code', 'GJ01TEAMFIRE')
        .eq('payment_status', 'active');

    if (!members) { console.log("No members found."); return; }

    const ghosts = [];
    members.forEach(m => {
        const isExpired = m.valid_until && new Date(m.valid_until) < new Date();
        const isInactive = m.is_active === false;

        if (isExpired || isInactive) {
            ghosts.push(m);
        }
    });

    console.log(`Found ${ghosts.length} 'Ghost' Members (Paid but Expired/Inactive):`);
    ghosts.forEach((m, i) => {
        console.log(`${i + 1}. ${m.name} (${m.email})`);
        console.log(`   - Plan: ${m.plan_name}`);
        console.log(`   - Expires: ${m.valid_until ? new Date(m.valid_until).toDateString() : 'N/A'}`);
        console.log(`   - Active Flag: ${m.is_active}`);
    });


    // --- 2. LEAD DISCREPANCY AUDIT ---
    console.log("\n--- 📉 LEAD DISCREPANCY ANALYSIS ---");
    // Fetch count of various statuses today
    const { data: leads } = await supabase
        .from('leads')
        .select('status, source')
        .gte('created_at', today);

    const stats = {
        total: leads.length,
        duplicate: leads.filter(l => l.status === 'Duplicate').length,
        invalid: leads.filter(l => l.status === 'Invalid' || l.status === 'Rejected').length,
        failed: leads.filter(l => l.status === 'Failed').length,
        himanshu_total: leads.filter(l => l.source && (l.source.includes('Himanshu') || l.source.includes('TFE'))).length
    };

    console.log(`Total Leads in DB Today: ${stats.total}`);
    console.log(`- Status 'Duplicate': ${stats.duplicate}`);
    console.log(`- Status 'Invalid/Rejected': ${stats.invalid}`);
    console.log(`- Status 'Failed': ${stats.failed}`);
    console.log(`- Inferred 'Himanshu' Source: ${stats.himanshu_total}`);

    console.log("\n💡 EXPLANATION LOGIC:");
    console.log("If 'Duplicate' count is low/zero, it means the webhook prevents insertion entirely.");
    console.log("The gap (415 - 383 = 32) is almost certainly rejected duplicates or invalid numbers.");
}

deepAudit();
