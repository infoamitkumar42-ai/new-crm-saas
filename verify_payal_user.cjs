const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const PLAN_QUOTAS = {
    'starter': 50,
    'supervisor': 105,
    'manager': 160,
    'weekly_boost': 84,
    'turbo_boost': 98
};

async function main() {
    const email = 'payalpuri3299@gmail.com';
    console.log(`🔍 Full Audit for: ${email}\n`);

    // 1. User profile
    const { data: user } = await supabase.from('users').select('*').eq('email', email).single();
    if (!user) { console.log("User NOT FOUND"); return; }

    console.log(`--- USER PROFILE ---`);
    console.log(`Name: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Team: ${user.team_code}`);
    console.log(`Current Plan: ${user.plan_name}`);
    console.log(`Is Active: ${user.is_active}`);
    console.log(`Account Created: ${user.created_at}`);

    // 2. ALL payments
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
            console.log(`Payment #${i + 1}: ₹${p.amount} | Plan: ${planName} | Quota: ${quota} leads | Date: ${new Date(p.created_at).toISOString().split('T')[0]}`);
        });
    }
    console.log(`\nTotal Payments: ${payments ? payments.length : 0}`);
    console.log(`Total Promised Leads (sum of all plan quotas): ${totalPromised}`);

    // 3. ALL leads ever assigned
    const { count: totalLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user.id);

    console.log(`\n--- LEADS ---`);
    console.log(`Total Leads Delivered (Lifetime): ${totalLeads}`);
    console.log(`Pending Leads: ${Math.max(0, totalPromised - totalLeads)}`);
    console.log(`Over-Delivered: ${totalLeads > totalPromised ? totalLeads - totalPromised : 0}`);

    // 4. Verdict
    console.log(`\n--- VERDICT ---`);
    if (user.is_active && totalLeads >= totalPromised && totalPromised > 0) {
        console.log(`⛔ WRONG: User is ACTIVE but quota is FULL. Should be STOPPED.`);
    } else if (!user.is_active && totalLeads < totalPromised && totalPromised > 0) {
        console.log(`⚠️ WRONG: User is INACTIVE but has ${totalPromised - totalLeads} leads PENDING.`);
    } else if (user.is_active && totalLeads < totalPromised) {
        console.log(`✅ CORRECT: User is ACTIVE and still has ${totalPromised - totalLeads} leads pending. Receiving correctly.`);
    } else if (!user.is_active && totalLeads >= totalPromised && totalPromised > 0) {
        console.log(`✅ CORRECT: User is INACTIVE and all ${totalPromised} promised leads have been delivered. Correctly stopped.`);
    } else {
        console.log(`Status: ${user.is_active ? 'Active' : 'Inactive'} | No clear verdict possible.`);
    }
}

main().catch(console.error);
