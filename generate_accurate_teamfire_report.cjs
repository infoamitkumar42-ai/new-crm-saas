const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

/*
  CORRECT PLAN LIMITS (from LeadFlow CRM Pricing Card):
  ┌──────────────┬────────┬──────────┬───────────┬─────────────┐
  │ Plan         │ Price  │ Duration │ Daily     │ Total Leads │
  ├──────────────┼────────┼──────────┼───────────┼─────────────┤
  │ Starter      │ ₹999   │ 10 Days  │ 5/day     │ 50          │
  │ Supervisor   │ ₹1,999 │ 15 Days  │ 7/day     │ 105         │
  │ Manager      │ ₹2,999 │ 20 Days  │ 8/day     │ 160         │
  │ Weekly Boost │ ₹1,999 │ 7 Days   │ 12/day    │ 84          │
  │ Turbo Boost  │ ₹2,499 │ 7 Days   │ 14/day    │ 98          │
  └──────────────┴────────┴──────────┴───────────┴─────────────┘
*/
const PLAN_INFO = {
    'starter': { price: 999, duration: 10, daily: 5, total: 50 },
    'supervisor': { price: 1999, duration: 15, daily: 7, total: 105 },
    'manager': { price: 2999, duration: 20, daily: 8, total: 160 },
    'weekly_boost': { price: 1999, duration: 7, daily: 12, total: 84 },
    'turbo_boost': { price: 2499, duration: 7, daily: 14, total: 98 }
};

async function main() {
    console.log("📊 Generating ACCURATE Quota Report for Himanshu's TEAMFIRE...\n");
    console.log("Using CORRECT plan limits from pricing card.\n");

    const TEAM_CODE = 'TEAMFIRE';

    // 1. Fetch ALL users in TEAMFIRE
    const { data: allUsers, error: uErr } = await supabase
        .from('users')
        .select('id, name, email, plan_name, is_active, created_at')
        .eq('team_code', TEAM_CODE)
        .order('name');

    if (uErr) { console.error("Error:", uErr.message); return; }
    console.log(`Total TEAMFIRE Members: ${allUsers.length}`);

    // 2. Fetch ALL payments (captured) for these users
    const userIds = allUsers.map(u => u.id);

    // Batch fetch payments (all of them)
    let allPayments = [];
    for (let i = 0; i < userIds.length; i += 50) {
        const batch = userIds.slice(i, i + 50);
        const { data: pays } = await supabase
            .from('payments')
            .select('user_id, created_at, amount, plan_name')
            .eq('status', 'captured')
            .in('user_id', batch)
            .order('created_at', { ascending: false });
        if (pays) allPayments = allPayments.concat(pays);
    }

    // Get latest payment per user
    const latestPayment = {};
    for (let p of allPayments) {
        if (!latestPayment[p.user_id]) {
            latestPayment[p.user_id] = p;
        }
    }

    // 3. Process each user
    const reportRows = [];
    let processedCount = 0;

    for (const u of allUsers) {
        processedCount++;
        if (processedCount % 20 === 0) console.log(`  Processing ${processedCount}/${allUsers.length}...`);

        const payment = latestPayment[u.id];

        // Determine which plan info to use
        const planKey = u.plan_name ? u.plan_name.toLowerCase() : null;
        const planInfo = planKey ? PLAN_INFO[planKey] : null;

        // Payment date (use payment date if available, else account creation date)
        const payDate = payment ? new Date(payment.created_at) : null;
        const payAmount = payment ? payment.amount : 0;
        const promisedLeads = planInfo ? planInfo.total : 0;
        const planDuration = planInfo ? planInfo.duration : 0;

        // Skip users with no payment and no valid plan
        if (!payment && !planInfo) {
            reportRows.push({
                name: u.name,
                email: u.email,
                is_active: u.is_active ? 'Active' : 'Inactive',
                plan: u.plan_name || 'None',
                payment_amount: 'No Payment',
                payment_date: 'N/A',
                plan_end_date: 'N/A',
                promised: 0,
                delivered: 0,
                pending: 0,
                status: 'NO PAYMENT FOUND'
            });
            continue;
        }

        // Calculate plan end date
        let planEndDate = null;
        if (payDate && planDuration > 0) {
            planEndDate = new Date(payDate);
            planEndDate.setDate(planEndDate.getDate() + planDuration);
        }

        // Count leads assigned to this user SINCE their payment date
        const sinceDate = payDate ? payDate.toISOString() : new Date(u.created_at).toISOString();

        let totalLeads = 0;
        const { count, error: cErr } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id)
            .gte('created_at', sinceDate);

        if (!cErr && count !== null) {
            totalLeads = count;
        }

        const delivered = totalLeads;
        const pending = Math.max(0, promisedLeads - delivered);
        const isExpired = planEndDate ? new Date() > planEndDate : false;

        // Status logic
        let status = '';
        if (u.is_active && delivered >= promisedLeads && promisedLeads > 0) {
            status = 'QUOTA FULL - SHOULD STOP';
        } else if (!u.is_active && delivered < promisedLeads && promisedLeads > 0) {
            status = 'INACTIVE - LEADS PENDING';
        } else if (u.is_active && delivered < promisedLeads) {
            status = 'ACTIVE - RECEIVING';
        } else if (!u.is_active && delivered >= promisedLeads && promisedLeads > 0) {
            status = 'COMPLETED - CORRECT';
        } else {
            status = u.is_active ? 'ACTIVE' : 'INACTIVE';
        }

        reportRows.push({
            name: u.name,
            email: u.email,
            is_active: u.is_active ? 'Active' : 'Inactive',
            plan: u.plan_name || 'None',
            payment_amount: payAmount > 0 ? payAmount : 'N/A',
            payment_date: payDate ? payDate.toISOString().split('T')[0] : 'N/A',
            plan_end_date: planEndDate ? planEndDate.toISOString().split('T')[0] : 'N/A',
            promised: promisedLeads,
            delivered,
            pending,
            status
        });
    }

    // Sort: problems first
    const statusOrder = {
        'QUOTA FULL - SHOULD STOP': 0,
        'INACTIVE - LEADS PENDING': 1,
        'ACTIVE - RECEIVING': 2,
        'COMPLETED - CORRECT': 3,
        'NO PAYMENT FOUND': 4,
        'ACTIVE': 5,
        'INACTIVE': 6
    };
    reportRows.sort((a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9));

    // Write CSV
    let csv = "Name,Email,Current Status,Plan,Payment Amount,Payment Date,Plan End Date,Promised Leads,Delivered Leads,Pending Leads,Flag\n";
    reportRows.forEach(r => {
        csv += `"${r.name}","${r.email}","${r.is_active}","${r.plan}","${r.payment_amount}","${r.payment_date}","${r.plan_end_date}","${r.promised}","${r.delivered}","${r.pending}","${r.status}"\n`;
    });

    fs.writeFileSync('TEAMFIRE_himanshu_ACCURATE_report.csv', csv);

    // Summary
    const quotaFull = reportRows.filter(r => r.status === 'QUOTA FULL - SHOULD STOP');
    const inactivePending = reportRows.filter(r => r.status === 'INACTIVE - LEADS PENDING');
    const activeReceiving = reportRows.filter(r => r.status === 'ACTIVE - RECEIVING');
    const completed = reportRows.filter(r => r.status === 'COMPLETED - CORRECT');
    const noPayment = reportRows.filter(r => r.status === 'NO PAYMENT FOUND');

    const totalPromised = reportRows.reduce((s, r) => s + r.promised, 0);
    const totalDelivered = reportRows.reduce((s, r) => s + r.delivered, 0);
    const totalPending = reportRows.reduce((s, r) => s + r.pending, 0);

    console.log("\n========== ACCURATE SUMMARY ==========");
    console.log(`Total Members Analyzed: ${reportRows.length}`);
    console.log(`\nTotal Promised Leads (All Plans): ${totalPromised}`);
    console.log(`Total Delivered Leads: ${totalDelivered}`);
    console.log(`Total PENDING Leads: ${totalPending}`);
    console.log(`\n--- BREAKDOWN ---`);
    console.log(`🛑 QUOTA FULL but still ACTIVE (Should Stop): ${quotaFull.length}`);
    if (quotaFull.length > 0) {
        quotaFull.forEach(u => console.log(`   - ${u.name} | ${u.plan} | Promised: ${u.promised} | Got: ${u.delivered}`));
    }
    console.log(`\n⚠️  INACTIVE but Leads PENDING: ${inactivePending.length}`);
    if (inactivePending.length > 0) {
        inactivePending.forEach(u => console.log(`   - ${u.name} | ${u.plan} | Promised: ${u.promised} | Got: ${u.delivered} | Pending: ${u.pending}`));
    }
    console.log(`\n✅ ACTIVE & Correctly Receiving: ${activeReceiving.length}`);
    console.log(`✅ INACTIVE & Completed (Correct): ${completed.length}`);
    console.log(`❓ No Payment Found: ${noPayment.length}`);

    console.log("\n✅ CSV saved: TEAMFIRE_himanshu_ACCURATE_report.csv");
}

main().catch(console.error);
