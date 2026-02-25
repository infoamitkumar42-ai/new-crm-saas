const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

/*
  CORRECT PLAN QUOTAS (Promised + Replacement):
  Starter      = 50 + 5  = 55 Total
  Supervisor   = 105 + 10 = 115 Total
  Manager      = 160 + 16 = 176 Total
  Weekly Boost = 84 + 8   = 92 Total
  Turbo Boost  = 98 + 10  = 108 Total
*/
function getQuotaFromPlanName(planName) {
    const map = {
        'starter': 55,
        'supervisor': 115,
        'manager': 176,
        'weekly_boost': 92,
        'turbo_boost': 108
    };
    return map[(planName || '').toLowerCase()] || 0;
}

async function main() {
    console.log("📊 FINAL REPORT (with Replacement Leads)\n");
    console.log("Quotas: Starter=55, Supervisor=115, Manager=176, Weekly=92, Turbo=108\n");

    const TEAM_CODE = 'TEAMFIRE';

    const { data: allUsers } = await supabase
        .from('users')
        .select('id, name, email, plan_name, is_active, created_at')
        .eq('team_code', TEAM_CODE)
        .order('name');

    console.log(`Total TEAMFIRE Members: ${allUsers.length}`);

    const userIds = allUsers.map(u => u.id);
    let allPayments = [];
    for (let i = 0; i < userIds.length; i += 50) {
        const batch = userIds.slice(i, i + 50);
        const { data: pays } = await supabase
            .from('payments')
            .select('user_id, created_at, amount, plan_name, status')
            .eq('status', 'captured')
            .in('user_id', batch)
            .order('created_at', { ascending: true });
        if (pays) allPayments = allPayments.concat(pays);
    }
    console.log(`Total Payments Found: ${allPayments.length}`);

    const paymentsByUser = {};
    for (let p of allPayments) {
        if (!paymentsByUser[p.user_id]) paymentsByUser[p.user_id] = [];
        paymentsByUser[p.user_id].push(p);
    }

    const reportRows = [];
    let processedCount = 0;

    for (const u of allUsers) {
        processedCount++;
        if (processedCount % 20 === 0) console.log(`  Processing ${processedCount}/${allUsers.length}...`);

        const userPayments = paymentsByUser[u.id] || [];
        const totalPayments = userPayments.length;
        const totalPaidAmount = userPayments.reduce((s, p) => s + (p.amount || 0), 0);

        let totalPromised = 0;
        const paymentDetails = [];

        for (let p of userPayments) {
            // Use payment's plan_name first, fallback to user's current plan
            const planName = p.plan_name || u.plan_name || '';
            const quota = getQuotaFromPlanName(planName);
            totalPromised += quota;
            paymentDetails.push({
                date: new Date(p.created_at).toISOString().split('T')[0],
                amount: p.amount,
                plan: planName,
                quota: quota
            });
        }

        const { count: totalDelivered } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id);

        const delivered = totalDelivered || 0;
        const pending = Math.max(0, totalPromised - delivered);
        const overDelivered = delivered > totalPromised ? delivered - totalPromised : 0;

        let status = '';
        if (totalPayments === 0) {
            status = 'NO PAYMENT';
        } else if (u.is_active && delivered >= totalPromised && totalPromised > 0) {
            status = 'QUOTA FULL - STOP';
        } else if (!u.is_active && pending > 0 && totalPromised > 0) {
            status = 'INACTIVE - PENDING';
        } else if (u.is_active && pending > 0) {
            status = 'ACTIVE - RECEIVING';
        } else if (!u.is_active && pending === 0 && totalPromised > 0) {
            status = 'COMPLETED';
        } else {
            status = u.is_active ? 'ACTIVE' : 'INACTIVE';
        }

        const payHistoryStr = paymentDetails.map(p => `${p.date}: Rs${p.amount} (${p.plan}=${p.quota})`).join(' | ');

        reportRows.push({
            name: u.name, email: u.email,
            is_active: u.is_active ? 'Active' : 'Inactive',
            current_plan: u.plan_name || 'None',
            total_payments: totalPayments, total_paid: totalPaidAmount,
            payment_history: payHistoryStr,
            total_promised: totalPromised, total_delivered: delivered,
            pending, over_delivered: overDelivered, status
        });
    }

    const statusOrder = { 'QUOTA FULL - STOP': 0, 'INACTIVE - PENDING': 1, 'ACTIVE - RECEIVING': 2, 'COMPLETED': 3, 'NO PAYMENT': 4, 'ACTIVE': 5, 'INACTIVE': 6 };
    reportRows.sort((a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9));

    let csv = "Name,Email,Current Status,Current Plan,Total Payments,Total Paid,Payment History,Total Promised Leads,Total Delivered Leads,Pending Leads,Over-Delivered,Flag\n";
    reportRows.forEach(r => {
        csv += `"${r.name}","${r.email}","${r.is_active}","${r.current_plan}","${r.total_payments}","${r.total_paid}","${r.payment_history}","${r.total_promised}","${r.total_delivered}","${r.pending}","${r.over_delivered}","${r.status}"\n`;
    });
    fs.writeFileSync('TEAMFIRE_FINAL_WITH_REPLACEMENTS.csv', csv);

    const paidUsers = reportRows.filter(r => r.total_payments > 0);
    const quotaFull = reportRows.filter(r => r.status === 'QUOTA FULL - STOP');
    const inactivePending = reportRows.filter(r => r.status === 'INACTIVE - PENDING');
    const activeReceiving = reportRows.filter(r => r.status === 'ACTIVE - RECEIVING');
    const completed = reportRows.filter(r => r.status === 'COMPLETED');
    const noPayment = reportRows.filter(r => r.status === 'NO PAYMENT');

    const grandPromised = paidUsers.reduce((s, r) => s + r.total_promised, 0);
    const grandDelivered = paidUsers.reduce((s, r) => s + r.total_delivered, 0);
    const grandPending = paidUsers.reduce((s, r) => s + r.pending, 0);
    const grandOver = paidUsers.reduce((s, r) => s + r.over_delivered, 0);
    const grandPaid = paidUsers.reduce((s, r) => s + r.total_paid, 0);
    const grandPaymentCount = paidUsers.reduce((s, r) => s + r.total_payments, 0);

    console.log("\n========================================");
    console.log("   FINAL SUMMARY (WITH REPLACEMENTS)");
    console.log("========================================");
    console.log(`Total Members: ${reportRows.length}`);
    console.log(`Paid Members: ${paidUsers.length} | No Payment: ${noPayment.length}`);
    console.log(`Total Payments: ${grandPaymentCount} | Total Collected: Rs${grandPaid.toLocaleString()}`);
    console.log(`\nTotal Promised (incl Replacements): ${grandPromised}`);
    console.log(`Total Delivered: ${grandDelivered}`);
    console.log(`Total PENDING: ${grandPending}`);
    console.log(`Total Over-Delivered: ${grandOver}`);
    console.log(`\n--- FLAGS ---`);
    console.log(`🛑 QUOTA FULL but Active (STOP): ${quotaFull.length}`);
    if (quotaFull.length > 0) quotaFull.forEach(u => console.log(`   - ${u.name} | Pay: ${u.total_payments}x | Promised: ${u.total_promised} | Got: ${u.total_delivered} | Over: +${u.over_delivered}`));
    console.log(`⚠️  INACTIVE but PENDING: ${inactivePending.length}`);
    if (inactivePending.length > 0) inactivePending.forEach(u => console.log(`   - ${u.name} | Pay: ${u.total_payments}x | Promised: ${u.total_promised} | Got: ${u.total_delivered} | Pending: ${u.pending}`));
    console.log(`✅ Active & Receiving: ${activeReceiving.length}`);
    console.log(`✅ Completed: ${completed.length}`);
    console.log(`❓ No Payment: ${noPayment.length}`);
    console.log("\n✅ CSV: TEAMFIRE_FINAL_WITH_REPLACEMENTS.csv");
}

main().catch(console.error);
