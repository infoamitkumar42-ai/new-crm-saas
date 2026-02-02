const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function generatePaymentReport() {
    console.log("📊 USER PAYMENT & RENEWAL REPORT\n");

    // Fetch users with plan
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, plan_name, is_active, total_leads_received, total_leads_promised')
        .neq('plan_name', 'none')
        .order('name', { ascending: true });

    if (error) return console.log(error.message);

    // Fetch payments
    const { data: payments } = await supabase
        .from('payments')
        .select('user_id, amount, created_at')
        .eq('status', 'captured')
        .order('created_at', { ascending: true });

    // Map payments
    const paymentMap = new Map();
    (payments || []).forEach(p => {
        if (!paymentMap.has(p.user_id)) paymentMap.set(p.user_id, []);
        paymentMap.get(p.user_id).push(p);
    });

    // Categorize
    let firstPaymentActive = [];   // 1 payment, is_active = true
    let renewedUsers = [];         // 2+ payments
    let churnedUsers = [];         // 1 payment, is_active = false (didn't renew)

    users.forEach(u => {
        const userPayments = paymentMap.get(u.id) || [];
        const payCount = userPayments.length;

        if (payCount >= 2) {
            renewedUsers.push({ ...u, payCount });
        } else if (payCount === 1) {
            if (u.is_active) {
                firstPaymentActive.push({ ...u, payCount });
            } else {
                churnedUsers.push({ ...u, payCount });
            }
        } else {
            // 0 payments = manual activation
            if (u.is_active) {
                firstPaymentActive.push({ ...u, payCount: 'Manual' });
            } else {
                churnedUsers.push({ ...u, payCount: 'Manual' });
            }
        }
    });

    // Print Reports
    console.log(`==========================================================`);
    console.log(`✅ 1ST PAYMENT ACTIVE USERS (Running): ${firstPaymentActive.length}`);
    console.log(`==========================================================`);
    firstPaymentActive.forEach((u, i) => {
        console.log(`  ${String(i + 1).padEnd(2)}. ${u.name.padEnd(22)} | ${u.plan_name.padEnd(12)} | Leads: ${u.total_leads_received}/${u.total_leads_promised}`);
    });

    console.log(`\n==========================================================`);
    console.log(`🔄 RENEWED USERS (2+ Payments): ${renewedUsers.length}`);
    console.log(`==========================================================`);
    renewedUsers.forEach((u, i) => {
        console.log(`  ${String(i + 1).padEnd(2)}. ${u.name.padEnd(22)} | ${u.plan_name.padEnd(12)} | Payments: ${u.payCount}x | Leads: ${u.total_leads_received}/${u.total_leads_promised}`);
    });

    console.log(`\n==========================================================`);
    console.log(`⚠️ CHURNED - 1st Plan Stopped, No Renewal: ${churnedUsers.length}`);
    console.log(`==========================================================`);
    churnedUsers.forEach((u, i) => {
        const remaining = (u.total_leads_promised || 0) - (u.total_leads_received || 0);
        console.log(`  ${String(i + 1).padEnd(2)}. ${u.name.padEnd(22)} | ${u.plan_name.padEnd(12)} | Leads: ${u.total_leads_received}/${u.total_leads_promised} | Pending: ${remaining}`);
    });

    console.log(`\n==========================================================`);
    console.log(`📊 SUMMARY`);
    console.log(`==========================================================`);
    console.log(`Total Paid Users:               ${users.length}`);
    console.log(`1st Payment Active:             ${firstPaymentActive.length}`);
    console.log(`Renewed (Loyal Customers):      ${renewedUsers.length}`);
    console.log(`Churned (Need Follow-up):       ${churnedUsers.length}`);
}

generatePaymentReport();
