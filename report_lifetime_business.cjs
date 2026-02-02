const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function generateLifetimeReport() {
    console.log("📊 GENERATING LIFETIME PAID USER REPORT...\n");

    // 1. Fetch All Users who have ever paid (status active OR inactive but with plan history)
    // Actually, best way is to fetch ALL users and their payments.

    const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, name, email, plan_name, total_leads_received, total_leads_promised, created_at, is_active, payment_status')
        .order('created_at', { ascending: false });

    if (userError) {
        console.log(`❌ Error fetching users: ${userError.message}`);
        return;
    }

    // 2. Fetch All Captured Payments
    const { data: payments, error: payError } = await supabase
        .from('payments')
        .select('user_id, amount, created_at, status')
        .eq('status', 'captured')
        .order('created_at', { ascending: true });

    if (payError) {
        console.log(`❌ Error fetching payments: ${payError.message}`);
        return;
    }

    // 3. Process Data
    const paidUsersMap = new Map();
    let quotaFinishedCount = 0;

    // Map payments to users
    payments.forEach(p => {
        if (!paidUsersMap.has(p.user_id)) {
            paidUsersMap.set(p.user_id, []);
        }
        paidUsersMap.get(p.user_id).push(p);
    });

    const report = [];

    users.forEach(u => {
        const userPayments = paidUsersMap.get(u.id) || [];

        // Filter: Only include if they have at least 1 payment OR have a Plan set (manual activation)
        if (userPayments.length > 0 || (u.plan_name && u.plan_name !== 'none')) {

            // Check Quota Status
            const received = u.total_leads_received || 0;
            const promised = u.total_leads_promised || 0;
            const isQuotaDone = promised > 0 && received >= promised;

            if (isQuotaDone) quotaFinishedCount++;

            report.push({
                name: u.name,
                email: u.email,
                plan: u.plan_name,
                leads: `${received}/${promised}`,
                quotaStatus: isQuotaDone ? '🔴 DONE' : '🟢 ACTIVE',
                payments: userPayments.map((p, i) => `Pay #${i + 1}: ₹${p.amount} (${new Date(p.created_at).toLocaleDateString()})`),
                totalPaid: userPayments.reduce((sum, p) => sum + p.amount, 0),
                isActive: u.is_active
            });
        }
    });

    // 4. Print Report
    console.log(`🏆 TOTAL LIFETIME PAID USERS: ${report.length}`);
    console.log(`⚠️ USERS WITH QUOTA FINISHED:  ${quotaFinishedCount}`);
    console.log(`\nDetailed List (Most Recent First):\n`);

    const headers = ['Name', 'Plan', 'Leads (Rec/Tot)', 'Total Paid', 'Quota', 'Payment History'];
    console.log(headers.join(' | '));
    console.log('-'.repeat(120));

    report.forEach(r => {
        const payHistory = r.payments.join(' | ');
        console.log(`${r.name.padEnd(20)} | ${r.plan.padEnd(10)} | ${r.leads.padEnd(12)} | ₹${r.totalPaid.toString().padEnd(6)} | ${r.quotaStatus} | ${payHistory}`);
    });
}

generateLifetimeReport();
