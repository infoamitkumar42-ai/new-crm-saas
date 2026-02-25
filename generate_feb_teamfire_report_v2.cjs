const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

const TEAM = 'TEAMFIRE';
const FEB_START = '2026-02-01T00:00:00.000Z';
const CSV_FILE = 'TEAMFIRE_FEB_DETAILED_REPORT.csv';

(async () => {
    console.log(`=== 📊 GENERATING DETAILED FEB REPORT FOR ${TEAM} ===`);

    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, plan_name, is_active')
        .eq('team_code', TEAM)
        .neq('plan_name', 'none');

    if (error) { console.error('Error fetching users:', error); return; }

    console.log(`Analyzing ${users.length} members...`);

    const headers = ['Name,Email,Plan,Status,Feb_Payment_History,Feb_Total_Paid_Amount,Feb_Total_Quota,Feb_Leads_Used,Pending_Feb_Quota'];
    const rows = [];

    let teamTotalPayments = 0;
    let teamTotalAmount = 0;
    let teamTotalQuota = 0;
    let teamTotalUsed = 0;

    for (const user of users) {
        // 1. Fetch Feb Payments
        const { data: payments } = await supabase
            .from('payments')
            .select('amount, created_at')
            .eq('user_id', user.id)
            .eq('status', 'captured')
            .gte('created_at', FEB_START);

        let userQuota = 0;
        let userAmount = 0;
        let payDetails = [];

        if (payments && payments.length > 0) {
            payments.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

            payments.forEach(p => {
                const amt = Math.round(p.amount);
                userAmount += amt;
                let limit = 0;
                // Strict Price Logic
                if (amt >= 990 && amt <= 1000) limit = 50;
                else if (amt >= 1990 && amt <= 2000) limit = 105;
                else if (amt >= 2990 && amt <= 3000) limit = 160;
                else if (amt >= 2490 && amt <= 2500) limit = 98;
                else if (amt >= 4490) limit = 160;

                userQuota += limit;
                payDetails.push(`${new Date(p.created_at).toLocaleDateString()}(₹${amt})`);
            });
        }

        // 2. Fetch Feb Leads Used
        const { count: userUsed, error: leadError } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', user.id)
            .gte('created_at', FEB_START);

        if (leadError) { console.error(`Error fetching leads for ${user.email}:`, leadError); continue; }

        const pendingQuota = Math.max(0, userQuota - userUsed);
        const status = user.is_active ? 'Active' : 'Inactive';
        const payHistoryString = payDetails.length > 0 ? payDetails.join(' | ') : 'N/A';

        rows.push(`"${user.name}","${user.email}",${user.plan_name},${status},"${payHistoryString}",₹${userAmount},${userQuota},${userUsed},${pendingQuota}`);

        // Team Totals
        teamTotalPayments += payments ? payments.length : 0;
        teamTotalAmount += userAmount;
        teamTotalQuota += userQuota;
        teamTotalUsed += userUsed;
    }

    // Add Summary Row
    rows.push('');
    rows.push(`TOTAL TEAM STATS,,,,,"₹${teamTotalAmount}",${teamTotalQuota},${teamTotalUsed},${teamTotalQuota - teamTotalUsed}`);
    rows.push(`,,,,Total Payments: ${teamTotalPayments},,,,`);

    const csvContent = headers.concat(rows).join('\n');
    fs.writeFileSync(CSV_FILE, csvContent);
    console.log(`\n✅ Detailed Report saved to ${CSV_FILE}`);

    console.log(`\n--- TEAM TOTALS (FEB) ---`);
    console.log(`Total Active Members: ${users.filter(u => u.is_active).length}`);
    console.log(`Total Payments Count: ${teamTotalPayments}`);
    console.log(`Total Payment Amount: ₹${teamTotalAmount}`);
    console.log(`Total Promised Leads: ${teamTotalQuota}`);
    console.log(`Total Leads Assigned: ${teamTotalUsed}`);
    console.log(`Total Pending Leads: ${teamTotalQuota - teamTotalUsed}`);

})();
