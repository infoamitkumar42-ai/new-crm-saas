const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

const TEAM = 'TEAMFIRE';
const CSV_FILE = 'HIMANSHU_WEEKLY_BOOSTER_AUDIT.csv';

(async () => {
    console.log(`=== 🕵️ AUDITING HIMANSHU'S TEAM (${TEAM}) - WEEKLY BOOSTERS ===`);

    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, plan_name, is_active, total_leads_promised, total_leads_received')
        .eq('team_code', TEAM)
        .eq('is_active', true)
        .ilike('plan_name', '%boost%');

    if (error) { console.error('Error fetching users:', error); return; }

    console.log(`Found ${users.length} active Weekly Booster members in ${TEAM}.`);

    const headers = ['Name,Email,Plan,Promised,Received,Pending,Total_Paid_Amount,Last_Payment_Date'];
    const rows = [];

    for (const user of users) {
        const promised = user.total_leads_promised || 0;
        const received = user.total_leads_received || 0;
        const pending = Math.max(0, promised - received);

        // Fetch payments
        const { data: payments } = await supabase
            .from('payments')
            .select('amount, created_at')
            .eq('user_id', user.id)
            .eq('status', 'captured')
            .order('created_at', { ascending: false });

        let totalAmount = 0;
        let lastPayDate = 'N/A';

        if (payments && payments.length > 0) {
            lastPayDate = new Date(payments[0].created_at).toLocaleDateString();
            totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
        }

        rows.push(`"${user.name}","${user.email}",${user.plan_name},${promised},${received},${pending},₹${totalAmount.toFixed(2)},${lastPayDate}`);
    }

    const csvContent = headers.concat(rows).join('\n');
    fs.writeFileSync(CSV_FILE, csvContent);
    console.log(`\n✅ Detailed Report saved to ${CSV_FILE}`);

    // Summary console output
    if (users.length > 0) {
        console.log('\nTop 5 users by pending leads:');
        const sorted = [...users].sort((a, b) => (b.total_leads_promised - b.total_leads_received) - (a.total_leads_promised - a.total_leads_received));
        sorted.slice(0, 5).forEach(u => {
            const p = Math.max(0, (u.total_leads_promised || 0) - (u.total_leads_received || 0));
            console.log(`- ${u.name}: ${p} leads pending`);
        });
    }

})();
