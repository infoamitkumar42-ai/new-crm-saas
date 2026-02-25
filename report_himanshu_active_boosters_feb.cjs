const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

const TEAM = 'TEAMFIRE';
const EXCLUDE_NAME = 'Himanshu Sharma';
const CSV_FILE = 'HIMANSHU_TEAM_FEB_BOOSTER_AUDIT.csv';

(async () => {
    console.log(`=== 🕵️ FEB PAYMENT AUDIT: ${TEAM} (Active Boosters, Excl. ${EXCLUDE_NAME}) ===`);

    // 1. Get active boosters in Team
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, name, email, plan_name, total_leads_promised, total_leads_received')
        .eq('team_code', TEAM)
        .eq('is_active', true)
        .ilike('plan_name', '%boost%');

    if (userError) { console.error('Error fetching users:', userError); return; }

    const targetUsers = users.filter(u => u.name !== EXCLUDE_NAME);
    console.log(`Analyzing ${targetUsers.length} members...`);

    const headers = ['Name,Email,Plan,Pending_Leads,Feb_Total_Paid,Feb_Payment_Details'];
    const rows = [];

    for (const user of targetUsers) {
        // Fetch all payments for this user in Feb
        const { data: payments, error: payError } = await supabase
            .from('payments')
            .select('amount, created_at')
            .eq('user_id', user.id)
            .eq('status', 'captured')
            .gte('created_at', '2026-02-01T00:00:00.000Z')
            .lte('created_at', '2026-02-28T23:59:59.999Z')
            .order('created_at', { ascending: true });

        if (payError) { console.error(`Error fetching payments for ${user.email}:`, payError); continue; }

        let febTotal = 0;
        let details = [];

        if (payments && payments.length > 0) {
            payments.forEach(p => {
                const date = new Date(p.created_at).toLocaleDateString();
                details.push(`${date}: ₹${p.amount}`);
                febTotal += (p.amount || 0);
            });
        }

        const promised = user.total_leads_promised || 0;
        const received = user.total_leads_received || 0;
        const pending = Math.max(0, promised - received);

        const detailsStr = details.length > 0 ? `"${details.join(' | ')}"` : 'No Feb Payments';
        rows.push(`"${user.name}","${user.email}",${user.plan_name},${pending},₹${febTotal.toFixed(2)},${detailsStr}`);
    }

    const csvContent = headers.concat(rows).join('\n');
    fs.writeFileSync(CSV_FILE, csvContent);
    console.log(`\n✅ Detailed Feb Audit saved to ${CSV_FILE}`);

    // Summary table for console
    console.log('\n| Name | Pending | Feb Total | Payment History |');
    console.log('|---|---|---|---|');
    rows.slice(0, 10).forEach(r => {
        const f = r.split(',');
        console.log(`| ${f[0].replace(/\"/g, '')} | ${f[3]} | ${f[4]} | ${f[5].replace(/\"/g, '')} |`);
    });

})();
