const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

/*
  CORRECT PLAN QUOTAS (from LeadFlow CRM Pricing Card):
  Starter      = 50 Total Leads   (₹999,  10 Days)
  Supervisor   = 105 Total Leads  (₹1999, 15 Days)
  Manager      = 160 Total Leads  (₹2999, 20 Days)
  Weekly Boost = 84 Total Leads   (₹1999, 7 Days)
  Turbo Boost  = 98 Total Leads   (₹2499, 7 Days)
  
  LOGIC:
  - Each payment = 1 plan purchase = 1 promised quota
  - If a user paid 3 times for starter, total promised = 3 x 50 = 150
  - Total Delivered = ALL leads ever assigned to the user (lifetime)
  - Pending = Total Promised - Total Delivered (can be negative if over-delivered)
*/

// Map payment amount to plan quota
function getQuotaFromPaymentAmount(amount) {
    if (amount === 999) return { plan: 'Starter', quota: 50 };
    if (amount === 1999) return { plan: 'Supervisor/Weekly Boost', quota: null }; // Ambiguous - need plan_name
    if (amount === 2999) return { plan: 'Manager', quota: 160 };
    if (amount === 2499) return { plan: 'Turbo Boost', quota: 98 };
    return { plan: 'Unknown', quota: 0 };
}

// Map plan name to quota
function getQuotaFromPlanName(planName) {
    const map = {
        'starter': 50,
        'supervisor': 105,
        'manager': 160,
        'weekly_boost': 84,
        'turbo_boost': 98
    };
    return map[(planName || '').toLowerCase()] || 0;
}

async function main() {
    console.log("📊 FINAL ACCURATE REPORT: ALL Payments Counted for Each User\n");
    console.log("Logic: Total Promised = SUM of quotas across ALL payments");
    console.log("       Total Delivered = ALL leads ever assigned (lifetime)");
    console.log("       Pending = Promised - Delivered\n");

    const TEAM_CODE = 'TEAMFIRE';

    // 1. Fetch ALL 159 TEAMFIRE users
    const { data: allUsers, error: uErr } = await supabase
        .from('users')
        .select('id, name, email, plan_name, is_active, created_at')
        .eq('team_code', TEAM_CODE)
        .order('name');

    if (uErr) { console.error("Error:", uErr.message); return; }
    console.log(`Total TEAMFIRE Members: ${allUsers.length}`);

    // 2. Fetch ALL payments for ALL these users at once
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

    console.log(`Total Payments Found (All Users Combined): ${allPayments.length}`);

    // Group payments per user
    const paymentsByUser = {};
    for (let p of allPayments) {
        if (!paymentsByUser[p.user_id]) paymentsByUser[p.user_id] = [];
        paymentsByUser[p.user_id].push(p);
    }

    // 3. Process each user
    const reportRows = [];
    let processedCount = 0;

    for (const u of allUsers) {
        processedCount++;
        if (processedCount % 20 === 0) console.log(`  Processing ${processedCount}/${allUsers.length}...`);

        const userPayments = paymentsByUser[u.id] || [];
        const totalPayments = userPayments.length;
        const totalPaidAmount = userPayments.reduce((s, p) => s + (p.amount || 0), 0);

        // Calculate total promised leads from ALL payments
        let totalPromised = 0;
        const paymentDetails = [];

        for (let p of userPayments) {
            // Try to determine quota from payment's plan_name first, then from amount
            let quota = 0;
            let planLabel = '';

            if (p.plan_name) {
                quota = getQuotaFromPlanName(p.plan_name);
                planLabel = p.plan_name;
            }

            // If plan_name didn't give us a quota, try by amount
            if (quota === 0 && p.amount) {
                const fromAmount = getQuotaFromPaymentAmount(p.amount);
                if (fromAmount.quota !== null) {
                    quota = fromAmount.quota;
                    planLabel = fromAmount.plan;
                } else {
                    // Ambiguous ₹1999 - could be supervisor or weekly_boost
                    // Use the user's current plan_name to disambiguate
                    quota = getQuotaFromPlanName(u.plan_name);
                    planLabel = u.plan_name || 'Unknown';
                }
            }

            totalPromised += quota;
            paymentDetails.push({
                date: new Date(p.created_at).toISOString().split('T')[0],
                amount: p.amount,
                plan: planLabel,
                quota: quota
            });
        }

        // Count ALL leads ever assigned to this user (lifetime total)
        const { count: totalDelivered, error: cErr } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id);

        const delivered = (!cErr && totalDelivered !== null) ? totalDelivered : 0;
        const pending = Math.max(0, totalPromised - delivered);
        const overDelivered = delivered > totalPromised ? delivered - totalPromised : 0;

        // Status determination
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

        // Build payment history string for CSV
        const payHistoryStr = paymentDetails.map(p => `${p.date}: ₹${p.amount} (${p.plan}=${p.quota})`).join(' | ');

        reportRows.push({
            name: u.name,
            email: u.email,
            is_active: u.is_active ? 'Active' : 'Inactive',
            current_plan: u.plan_name || 'None',
            total_payments: totalPayments,
            total_paid: totalPaidAmount,
            payment_history: payHistoryStr,
            total_promised: totalPromised,
            total_delivered: delivered,
            pending: pending,
            over_delivered: overDelivered,
            status: status
        });
    }

    // Sort: problems first
    const statusOrder = {
        'QUOTA FULL - STOP': 0,
        'INACTIVE - PENDING': 1,
        'ACTIVE - RECEIVING': 2,
        'COMPLETED': 3,
        'NO PAYMENT': 4,
        'ACTIVE': 5,
        'INACTIVE': 6
    };
    reportRows.sort((a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9));

    // Write CSV
    let csv = "Name,Email,Current Status,Current Plan,Total Payments,Total Paid (₹),Payment History (Date: Amount Plan=Quota),Total Promised Leads,Total Delivered Leads,Pending Leads,Over-Delivered,Flag\n";
    reportRows.forEach(r => {
        csv += `"${r.name}","${r.email}","${r.is_active}","${r.current_plan}","${r.total_payments}","${r.total_paid}","${r.payment_history}","${r.total_promised}","${r.total_delivered}","${r.pending}","${r.over_delivered}","${r.status}"\n`;
    });

    fs.writeFileSync('TEAMFIRE_FINAL_ACCURATE_REPORT.csv', csv);

    // Summary
    const quotaFull = reportRows.filter(r => r.status === 'QUOTA FULL - STOP');
    const inactivePending = reportRows.filter(r => r.status === 'INACTIVE - PENDING');
    const activeReceiving = reportRows.filter(r => r.status === 'ACTIVE - RECEIVING');
    const completed = reportRows.filter(r => r.status === 'COMPLETED');
    const noPayment = reportRows.filter(r => r.status === 'NO PAYMENT');
    const paidUsers = reportRows.filter(r => r.total_payments > 0);

    const grandPromised = paidUsers.reduce((s, r) => s + r.total_promised, 0);
    const grandDelivered = paidUsers.reduce((s, r) => s + r.total_delivered, 0);
    const grandPending = paidUsers.reduce((s, r) => s + r.pending, 0);
    const grandOverDelivered = paidUsers.reduce((s, r) => s + r.over_delivered, 0);
    const grandPaidAmount = paidUsers.reduce((s, r) => s + r.total_paid, 0);
    const grandPayments = paidUsers.reduce((s, r) => s + r.total_payments, 0);

    console.log("\n========================================");
    console.log("   FINAL ACCURATE SUMMARY");
    console.log("========================================");
    console.log(`Total Members: ${reportRows.length}`);
    console.log(`Members who PAID: ${paidUsers.length}`);
    console.log(`Members with NO Payment: ${noPayment.length}`);
    console.log(`\nTotal Payments Made (All Users Combined): ${grandPayments}`);
    console.log(`Total Amount Collected: ₹${grandPaidAmount.toLocaleString()}`);
    console.log(`\nTotal Promised Leads (All Payments x Quotas): ${grandPromised}`);
    console.log(`Total Delivered Leads (Lifetime): ${grandDelivered}`);
    console.log(`Total PENDING Leads: ${grandPending}`);
    console.log(`Total OVER-Delivered: ${grandOverDelivered}`);
    console.log(`\n--- FLAG COUNTS ---`);
    console.log(`🛑 QUOTA FULL but Active (STOP these): ${quotaFull.length}`);
    if (quotaFull.length > 0) {
        quotaFull.forEach(u => console.log(`   - ${u.name} | Payments: ${u.total_payments} | Promised: ${u.total_promised} | Got: ${u.total_delivered} | Over: +${u.over_delivered}`));
    }
    console.log(`\n⚠️  INACTIVE but Leads PENDING: ${inactivePending.length}`);
    if (inactivePending.length > 0) {
        inactivePending.forEach(u => console.log(`   - ${u.name} | Payments: ${u.total_payments} | Promised: ${u.total_promised} | Got: ${u.total_delivered} | Pending: ${u.pending}`));
    }
    console.log(`\n✅ Active & Receiving: ${activeReceiving.length}`);
    console.log(`✅ Completed (Correct): ${completed.length}`);
    console.log(`❓ No Payment: ${noPayment.length}`);
    console.log("\n✅ CSV saved: TEAMFIRE_FINAL_ACCURATE_REPORT.csv");
}

main().catch(console.error);
