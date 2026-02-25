const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const PLAN_QUOTAS = { 'starter': 55, 'supervisor': 115, 'manager': 176, 'weekly_boost': 92, 'turbo_boost': 108 };

async function auditUser(email) {
    const { data: user } = await supabase.from('users').select('*').eq('email', email).single();
    if (!user) {
        // Try by name
        const { data: u2 } = await supabase.from('users').select('*').eq('name', email).limit(1);
        if (!u2 || u2.length === 0) { console.log(`NOT FOUND: ${email}`); return; }
        return auditByUser(u2[0]);
    }
    return auditByUser(user);
}

async function auditByUser(user) {
    console.log(`\n=== ${user.name} (${user.email}) ===`);
    console.log(`Plan: ${user.plan_name} | Active: ${user.is_active} | Team: ${user.team_code}`);

    const { data: payments } = await supabase.from('payments')
        .select('*').eq('user_id', user.id).eq('status', 'captured')
        .order('created_at', { ascending: true });

    let totalPromised = 0;
    console.log(`\nPayments: ${payments ? payments.length : 0}`);
    if (payments) {
        payments.forEach((p, i) => {
            const plan = p.plan_name || user.plan_name || '';
            const quota = PLAN_QUOTAS[plan.toLowerCase()] || 0;
            totalPromised += quota;
            console.log(`  #${i + 1}: ₹${p.amount} | ${plan} (${quota} leads) | ${new Date(p.created_at).toISOString().split('T')[0]}`);
        });
    }
    console.log(`Total Promised: ${totalPromised}`);

    const { count } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('assigned_to', user.id);
    console.log(`Total Delivered: ${count}`);
    console.log(`Pending: ${Math.max(0, totalPromised - count)}`);
    console.log(`Over: ${count > totalPromised ? count - totalPromised : 0}`);
}

async function main() {
    await auditUser('Saijel Goel');
    await auditUser('Ravenjeet Kaur');
}

main().catch(console.error);
