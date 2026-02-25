const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
    const nameToSearch = 'VANRAJ SINH VAJA';
    console.log(`🔍 Investigating User: ${nameToSearch}\n`);

    // Fetch User Details
    const { data: users, error: userError } = await supabase.from('users')
        .select('*')
        .ilike('name', `%${nameToSearch}%`);

    if (userError) {
        console.error("Error fetching user:", userError);
        return;
    }

    if (!users || users.length === 0) {
        console.log(`User '${nameToSearch}' not found in the users table.`);
        return;
    }

    for (const user of users) {
        console.log(`👤 User Found:`);
        console.log(`   - ID: ${user.id}`);
        console.log(`   - Name: ${user.name}`);
        console.log(`   - Email: ${user.email}`);
        console.log(`   - Phone: ${user.phone}`);
        console.log(`   - Team: ${user.team_code}`);
        console.log(`   - Status: ${user.is_active ? 'Active' : 'Inactive'} / ${user.payment_status}`);
        console.log(`   - Plan: ${user.plan_name}`);
        console.log(`   - Leads Received: ${user.leads_today} today / Lifetime Total Leads (from leads table next)`);

        const { count: lifetimeLeads } = await supabase.from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', user.id);

        console.log(`   - Lifetime Leads Received: ${lifetimeLeads || 0}`);

        // Fetch Payment Details
        const { data: payments, error: payError } = await supabase.from('payments')
            .select('*')
            .eq('user_id', user.id);

        console.log(`\n💳 Payment Records for ${user.name}:`);
        if (payError) {
            console.error("Error fetching payments:", payError);
        } else if (!payments || payments.length === 0) {
            console.log(`   ❌ No payments found AT ALL for this user in the payments table.`);
        } else {
            console.log(`   Found ${payments.length} payment record(s):`);
            payments.forEach((p, index) => {
                console.log(`   [${index + 1}] Amount: ₹${p.amount} | Status: ${p.status} | Plan: ${p.plan_name} | Date: ${p.created_at}`);
            });

            // Summarize captured vs other
            const captured = payments.filter(p => p.status === 'captured');
            if (captured.length > 0) {
                console.log(`   ✅ Valid (Captured) Payments: ${captured.length} (Total Amount: ₹${captured.reduce((sum, p) => sum + p.amount, 0)})`);
            } else {
                console.log(`   ❌ NONE of the payments are marked as 'captured' / valid.`);
            }
        }
        console.log("--------------------------------------------------\n");
    }
}

main().catch(console.error);
