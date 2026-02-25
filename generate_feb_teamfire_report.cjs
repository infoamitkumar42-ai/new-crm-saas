const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

const TEAM = 'TEAMFIRE';
const FEB_START = '2026-02-01T00:00:00.000Z';
const CSV_FILE = 'TEAMFIRE_FEB_ACCURATE_REPORT.csv';

(async () => {
    console.log(`=== 📊 GENERATING ACCURATE FEB REPORT FOR ${TEAM} ===`);

    // 1. Get all users in TEAMFIRE
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, plan_name, is_active, total_leads_promised, total_leads_received')
        .eq('team_code', TEAM)
        .neq('plan_name', 'none');

    if (error) { console.error('Error fetching users:', error); return; }

    console.log(`Found ${users.length} members in ${TEAM}.`);

    const headers = ['Name,Email,Plan,Status,Feb_Paid_Quota,Feb_Leads_Used,Pending_Feb_Quota,Last_Feb_Payment'];
    const rows = [];

    for (const user of users) {
        // 2. Fetch Feb Payments
        const { data: payments } = await supabase
            .from('payments')
            .select('amount, created_at')
            .eq('user_id', user.id)
            .eq('status', 'captured')
            .gte('created_at', FEB_START);

        let febPaidQuota = 0;
        let lastPayDate = 'N/A';
        if (payments && payments.length > 0) {
            payments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            lastPayDate = new Date(payments[0].created_at).toLocaleDateString();

            payments.forEach(p => {
                const amt = Math.round(p.amount);
                let limit = 0;
                if (amt >= 990 && amt <= 1000) limit = 50;
                else if (amt >= 1990 && amt <= 2000) limit = 105;
                else if (amt >= 2990 && amt <= 3000) limit = 160;
                else if (amt >= 2490 && amt <= 2500) limit = 98;
                else if (amt >= 4490) limit = 160;

                febPaidQuota += limit;
            });
        }

        // 3. Fetch Feb Leads Used
        const { count: febUsed, error: leadError } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', user.id)
            .gte('created_at', FEB_START);

        if (leadError) { console.error(`Error fetching leads for ${user.email}:`, leadError); continue; }

        const pendingFeb = Math.max(0, febPaidQuota - febUsed);
        const status = user.is_active ? 'Active' : 'Inactive';

        rows.push(`"${user.name}","${user.email}",${user.plan_name},${status},${febPaidQuota},${febUsed},${pendingFeb},${lastPayDate}`);
    }

    const csvContent = headers.concat(rows).join('\n');
    fs.writeFileSync(CSV_FILE, csvContent);
    console.log(`\n✅ Report saved to ${CSV_FILE}`);

    // Summary for Console
    const activeMembers = users.filter(u => u.is_active).length;
    console.log(`\nSummary:`);
    console.log(`- Total Members: ${users.length}`);
    console.log(`- Active Members: ${activeMembers}`);
    console.log(`- Done.`);

})();
