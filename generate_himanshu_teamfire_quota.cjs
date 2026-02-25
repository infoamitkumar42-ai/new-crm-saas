const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const PLAN_LIMITS = {
    'starter': 50,
    'weekly_boost': 100,
    'manager': 200,
    'supervisor': 150,
    'turbo_boost': 250
};

async function main() {
    // ===== STEP 1: Stop the 3 over-limit Chirag team users =====
    console.log("🛑 Stopping 3 over-limit users from Chirag's team...\n");
    const emailsToStop = [
        'yashdabhi@example.com', // We'll use name-based lookup instead
    ];

    // Actually look them up by name+team
    const { data: overLimitUsers } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('team_code', 'GJ01TEAMFIRE')
        .eq('is_active', true)
        .in('name', ['Yash Dabhi', 'Sonal Ravrani', 'Asmita']);

    if (overLimitUsers && overLimitUsers.length > 0) {
        for (let u of overLimitUsers) {
            await supabase.from('users').update({ is_active: false }).eq('id', u.id);
            console.log(`  ✅ Stopped: ${u.name} (${u.email})`);
        }
    }

    // ===== STEP 2: Generate quota report for HIMANSHU's TEAMFIRE =====
    console.log("\n📊 Generating Quota Report for Himanshu's TEAMFIRE...\n");

    const TEAM_CODE = 'TEAMFIRE';
    const feb1st = new Date('2026-02-01T00:00:00.000Z');

    const { data: users, error: uErr } = await supabase
        .from('users')
        .select('id, name, email, plan_name, is_active, created_at')
        .eq('team_code', TEAM_CODE)
        .order('name');

    if (uErr) { console.error("Error fetching users:", uErr.message); return; }

    console.log(`Total TEAMFIRE Members found: ${users.length}`);

    const userIds = users.map(u => u.id);
    const { data: payments } = await supabase
        .from('payments')
        .select('user_id, created_at, amount')
        .eq('status', 'captured')
        .in('user_id', userIds)
        .order('created_at', { ascending: false });

    const latestPayments = {};
    const paymentAmounts = {};
    if (payments) {
        for (let p of payments) {
            if (!latestPayments[p.user_id]) {
                latestPayments[p.user_id] = new Date(p.created_at);
                paymentAmounts[p.user_id] = p.amount;
            }
        }
    }

    const reportData = [];

    for (const u of users) {
        const hasFebPayment = latestPayments[u.id] && latestPayments[u.id] >= feb1st;
        const wasCreatedInFeb = new Date(u.created_at) >= feb1st;

        // Include user if they paid in Feb OR were created recently AND their account is active
        if (!hasFebPayment && !u.is_active) continue;

        const lastPayDate = latestPayments[u.id] || new Date(u.created_at);
        const payAmount = paymentAmounts[u.id] || 0;
        const limit = PLAN_LIMITS[u.plan_name] || 9999;

        const { data: leads } = await supabase
            .from('leads')
            .select('id')
            .eq('assigned_to', u.id)
            .gte('created_at', lastPayDate.toISOString());

        const delivered = leads ? leads.length : 0;
        const pending = limit !== 9999 ? Math.max(0, limit - delivered) : 'Unknown';

        let flag = "";
        if (u.is_active && limit !== 9999 && delivered >= limit) {
            flag = "⛔ SHOULD BE STOPPED (Quota Full)";
        } else if (!u.is_active && limit !== 9999 && delivered < limit) {
            flag = "⚠️ STOPPED EARLY (Pending Leads)";
        } else if (u.is_active && (limit === 9999 || delivered < limit)) {
            flag = "✅ NORMAL (Active & Receiving)";
        } else {
            flag = "✅ COMPLETED (Quota Done)";
        }

        reportData.push({
            name: u.name,
            email: u.email,
            is_active: u.is_active ? 'Active' : 'Inactive',
            plan: u.plan_name || 'N/A',
            payment_amount: payAmount > 0 ? `₹${payAmount}` : 'N/A',
            pay_date: lastPayDate.toISOString().split('T')[0],
            promised: limit !== 9999 ? limit : 'Unknown',
            delivered,
            pending,
            status: flag
        });
    }

    // Sort: issues first
    reportData.sort((a, b) => {
        const order = { '⛔': 0, '⚠️': 1, '✅': 2 };
        const aKey = a.status.slice(0, 2);
        const bKey = b.status.slice(0, 2);
        return (order[aKey] || 9) - (order[bKey] || 9);
    });

    // Write CSV
    let csv = "Name,Email,Status,Plan,Payment Amount,From Date,Promised Leads,Delivered Leads,Pending Leads,Flag\n";
    reportData.forEach(r => {
        csv += `"${r.name}","${r.email}","${r.is_active}","${r.plan}","${r.payment_amount}","${r.pay_date}","${r.promised}","${r.delivered}","${r.pending}","${r.status}"\n`;
    });

    fs.writeFileSync('TEAMFIRE_himanshu_quota_report.csv', csv);

    // Summary
    const shouldStop = reportData.filter(r => r.status.includes('SHOULD BE STOPPED')).length;
    const stoppedEarly = reportData.filter(r => r.status.includes('STOPPED EARLY')).length;
    const normal = reportData.filter(r => r.status.includes('NORMAL')).length;
    const completed = reportData.filter(r => r.status.includes('COMPLETED')).length;
    const totalPending = reportData.reduce((sum, r) => sum + (typeof r.pending === 'number' ? r.pending : 0), 0);

    console.log("\n=== QUICK SUMMARY ===");
    console.log(`Total TEAMFIRE Members Analyzed: ${reportData.length}`);
    console.log(`Active (Correctly Receiving): ${normal}`);
    console.log(`Active but SHOULD BE STOPPED (Quota Full): ${shouldStop}`);
    console.log(`Inactive with PENDING LEADS (Stopped Early): ${stoppedEarly}`);
    console.log(`Inactive & Completed: ${completed}`);
    console.log(`TOTAL PENDING LEADS ACROSS ALL USERS: ${totalPending}`);
    console.log("\n✅ CSV saved: TEAMFIRE_himanshu_quota_report.csv");
}

main().catch(console.error);
