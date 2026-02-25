const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    console.log('Fetching active users...');

    // 1. Get Active Users
    const { data: users, error } = await supabase
        .from('users')
        .select('*') // Need team_code, name, email ... using * for simplicity
        .eq('is_active', true)
        .neq('plan_name', 'none')
        .order('team_code', { ascending: true });

    if (error) { console.error(error); return; }

    console.log(`Found ${users.length} active users.`);

    // Header for CSV
    const headers = ['Team,Name,Email,Plan,LeadsUsed,TotalPromise,Pending,LastPaymentDate,LastAmount,Status'];
    const rows = [];

    // Group by Team for console output
    const teamGroups = {};

    for (const user of users) {
        // 2. Fetch Last Payment
        const { data: payments } = await supabase
            .from('payments')
            .select('amount, created_at, status')
            .eq('user_id', user.id)
            .eq('status', 'captured')
            .order('created_at', { ascending: false })
            .limit(1);

        const lastPay = payments && payments.length > 0 ? payments[0] : null;

        const used = user.total_leads_received || 0;
        const promised = user.total_leads_promised || 0;
        const pending = promised - used;
        const team = user.team_code || 'NO-TEAM';

        let status = 'Active';
        if (!lastPay) status = 'MANUAL_ACTIVATION';
        else if (pending > 500) status = 'ACTIVE (High Quota)';

        // Format Date
        const payDate = lastPay ? new Date(lastPay.created_at).toLocaleDateString() : 'N/A';
        const payAmt = lastPay ? `₹${Math.round(lastPay.amount)}` : '0';

        // Add to Rows
        rows.push(`${team},"${user.name}","${user.email}",${user.plan_name},${used},${promised},${pending},${payDate},${payAmt},${status}`);

        // Add to Group
        if (!teamGroups[team]) teamGroups[team] = [];
        teamGroups[team].push({
            name: user.name,
            email: user.email,
            pending: pending,
            payDate: payDate,
            status: status
        });
    }

    // Write CSV
    const csvContent = headers.concat(rows).join('\n');
    fs.writeFileSync('ACTIVE_USERS_REPORT_FEB16.csv', csvContent);
    console.log('✅ Report saved to ACTIVE_USERS_REPORT_FEB16.csv');

    // Print Logic for User Response
    console.log('\n=== 📊 ACTIVE USERS BY TEAM ===');
    for (const [team, members] of Object.entries(teamGroups)) {
        console.log(`\n📌 TEAM: ${team} (${members.length} Members)`);
        // Sort by Pending Leads (Descending) to show high value users first
        members.sort((a, b) => b.pending - a.pending);

        members.forEach(m => {
            console.log(`   - ${m.name} (${m.email}): Pending ${m.pending} Leads | Last Pay: ${m.payDate} | ${m.status}`);
        });
    }

})();
