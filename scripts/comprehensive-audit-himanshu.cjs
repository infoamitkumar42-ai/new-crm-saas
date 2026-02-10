const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runDetailedAudit() {
    console.log('--- STARTING COMPREHENSIVE AUDIT (TEAMFIRE / Himanshu) ---');
    const TEAM_CODE = 'TEAMFIRE';
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0] + 'T00:00:00.000Z';

    // 1. Fetch Users
    const { data: users, error: uErr } = await supabase
        .from('users')
        .select('id, name, email, leads_today, payment_status, plan_name, is_active')
        .eq('team_code', TEAM_CODE)
        .eq('is_active', true);

    if (uErr) {
        console.error('Error fetching users:', uErr);
        return;
    }

    // 2. Fetch Payments
    const { data: payments, error: pErr } = await supabase
        .from('payments')
        .select('user_id, payer_email, raw_payload, status, created_at, amount');

    if (pErr) {
        console.error('Error fetching payments:', pErr);
        return;
    }

    // 3. Fetch Leads Assigned Today
    const { data: todaysLeads, error: lErr } = await supabase
        .from('leads')
        .select('id, name, source, assigned_to, status')
        .gte('created_at', todayStr);

    if (lErr) {
        console.error('Error fetching leads:', lErr);
        return;
    }

    const report = [];

    for (const user of users) {
        // Find assigned leads for this user today
        const userLeads = todaysLeads.filter(l => l.assigned_to === user.id);

        // Skip if no leads today (unless they were part of the 59 I targeted)
        // But let's check everyone in the team to be safe.
        if (userLeads.length === 0 && user.leads_today === 0) continue;

        // Payment check
        const directPayment = payments.find(p => p.user_id === user.id);
        const emailPayment = payments.find(p =>
            p.payer_email === user.email ||
            (p.raw_payload && p.raw_payload.email === user.email)
        );
        const nameInPayload = payments.find(p => {
            if (!p.raw_payload) return false;
            const s = JSON.stringify(p.raw_payload).toLowerCase();
            return s.includes(user.name.toLowerCase());
        });

        const paid = !!(directPayment || emailPayment || nameInPayload);

        report.push({
            name: user.name,
            email: user.email,
            leadsToday: userLeads.length,
            storedLeadsToday: user.leads_today,
            status: user.payment_status,
            plan: user.plan_name,
            verifiedPaid: paid,
            paymentSource: directPayment ? 'UID Match' : (emailPayment ? 'Email Match' : (nameInPayload ? 'Payload Match' : 'NONE'))
        });
    }

    // Identify Himanshu Lead Sources
    const himanshuLeads = todaysLeads.filter(l => l.source && l.source.toLowerCase().includes('himanshu'));
    const sourceStats = {};
    himanshuLeads.forEach(l => {
        sourceStats[l.source] = (sourceStats[l.source] || 0) + 1;
    });

    console.log('\n--- LEAD SOURCE STATS (HIMANSHU) ---');
    console.table(Object.entries(sourceStats).map(([source, count]) => ({ source, count })));

    console.log('\n--- TEAM AUDIT REPORT ---');
    report.sort((a, b) => (a.verifiedPaid === b.verifiedPaid) ? (b.leadsToday - a.leadsToday) : (a.verifiedPaid ? 1 : -1));
    console.table(report);

    const unverifiedCount = report.filter(r => !r.verifiedPaid).length;
    console.log(`\nVerified Paid: ${report.length - unverifiedCount}`);
    console.log(`Unverified: ${unverifiedCount}`);
}

runDetailedAudit();
