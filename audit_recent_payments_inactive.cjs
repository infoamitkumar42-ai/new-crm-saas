const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
    console.log("🔍 Auditing Baljinder's Lead History and Other Inactive Users...\n");

    const baljinderEmail = 'nikkibaljinderkaur@gmail.com';

    // 1. Get Baljinder's ID
    const { data: bUser, error: bErr } = await supabase
        .from('users')
        .select('id')
        .eq('email', baljinderEmail)
        .single();

    if (bUser) {
        const { data: bLeads, error: lErr } = await supabase
            .from('leads')
            .select('id, created_at, assigned_at')
            .eq('assigned_to', bUser.id);

        console.log(`--- BALJINDER LEAD HISTORY ---`);
        if (lErr) {
            console.error("Error fetching leads:", lErr.message);
        } else {
            console.log(`Total Leads Assigned Ever: ${bLeads.length}`);
            if (bLeads.length > 0) {
                // Find all after Feb 1
                const afterFeb1 = bLeads.filter(l => new Date(l.assigned_at || l.created_at) >= new Date('2026-02-01T00:00:00Z'));
                console.log(`Leads Assigned Since Feb 1st (Payment Date): ${afterFeb1.length}`);
            }
        }
    }

    console.log(`\n--- ALL INACTIVE USERS PAID IN FEBRUARY ---`);
    // 2. Fetch all successful payments since Feb 1st
    const febStart = '2026-02-01T00:00:00.000Z';
    const { data: recentPayments, error: pErr } = await supabase
        .from('payments')
        .select('id, user_id, amount, created_at, status')
        .eq('status', 'captured')
        .gte('created_at', febStart);

    if (pErr) {
        console.error("Error fetching payments:", pErr.message);
        return;
    }

    // Get unique user IDs who paid in Feb
    const paidUserIds = Array.from(new Set(recentPayments.map(p => p.user_id)));

    // Now fetch which of these are currently INACTIVE
    const { data: inactiveUsers, error: uErr } = await supabase
        .from('users')
        .select('id, name, email, plan_name, is_active, created_at')
        .in('id', paidUserIds)
        .eq('is_active', false);

    if (uErr) {
        console.error("Error fetching users:", uErr.message);
        return;
    }

    if (inactiveUsers.length === 0) {
        console.log("✅ Good news! There are 0 users who are inactive despite paying in February.");
    } else {
        console.log(`⚠️ Found ${inactiveUsers.length} users marked INACTIVE who made a payment in February 2026:`);

        inactiveUsers.forEach(u => {
            // Find their payments to display
            const userPayments = recentPayments.filter(p => p.user_id === u.id);
            const latestPayment = userPayments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

            // Calculate days since payment
            const daysSince = Math.floor((new Date() - new Date(latestPayment.created_at)) / (1000 * 60 * 60 * 24));

            console.log(`\n- Name: ${u.name}`);
            console.log(`  Email: ${u.email}`);
            console.log(`  Plan: ${u.plan_name}`);
            console.log(`  Latest Payment: ₹${latestPayment.amount} on ${latestPayment.created_at.split('T')[0]} (${daysSince} days ago)`);
        });
    }
}

main().catch(console.error);
