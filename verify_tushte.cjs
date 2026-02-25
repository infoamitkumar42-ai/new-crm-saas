const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const PLAN_QUOTAS = {
    'starter': 55,       // 50 + 5 replacement
    'supervisor': 115,   // 105 + 10 replacement
    'manager': 176,      // 160 + 16 replacement
    'weekly_boost': 92,  // 84 + 8 replacement
    'turbo_boost': 108   // 98 + 10 replacement
};

async function main() {
    const email = 'tushte756@gmail.com';
    console.log(`🔍 Full Audit for: ${email}\n`);

    const { data: user } = await supabase.from('users').select('*').eq('email', email).single();
    if (!user) { console.log("User NOT FOUND"); return; }

    console.log(`--- USER PROFILE ---`);
    console.log(`Name: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Team: ${user.team_code}`);
    console.log(`Current Plan: ${user.plan_name}`);
    console.log(`Is Active: ${user.is_active}`);
    console.log(`Account Created: ${user.created_at}`);

    const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'captured')
        .order('created_at', { ascending: true });

    console.log(`\n--- ALL PAYMENTS (${payments ? payments.length : 0}) ---`);
    let totalPromised = 0;
    if (payments && payments.length > 0) {
        payments.forEach((p, i) => {
            const planName = p.plan_name || user.plan_name || 'unknown';
            const quota = PLAN_QUOTAS[planName.toLowerCase()] || 0;
            totalPromised += quota;
            console.log(`Payment #${i + 1}: ₹${p.amount} | Plan: ${planName} | Quota: ${quota} leads (incl replacement) | Date: ${new Date(p.created_at).toISOString().split('T')[0]}`);
        });
    }
    console.log(`\nTotal Payments: ${payments ? payments.length : 0}`);
    console.log(`Total Promised Leads (all payments combined): ${totalPromised}`);

    const { count: totalLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user.id);

    console.log(`\n--- LEADS ---`);
    console.log(`Total Leads Delivered (Lifetime): ${totalLeads}`);
    console.log(`Pending: ${Math.max(0, totalPromised - totalLeads)}`);
    console.log(`Over-Delivered: ${totalLeads > totalPromised ? totalLeads - totalPromised : 0}`);

    console.log(`\n--- VERDICT ---`);
    if (totalLeads >= totalPromised && totalPromised > 0) {
        console.log(`⛔ Quota FULL. Promised: ${totalPromised}, Got: ${totalLeads}. Over by ${totalLeads - totalPromised}. STOP is CORRECT.`);
    } else if (totalLeads < totalPromised) {
        console.log(`⚠️ Leads PENDING. Promised: ${totalPromised}, Got: ${totalLeads}. Pending: ${totalPromised - totalLeads}. Should NOT be stopped.`);
    }
}

main().catch(console.error);
