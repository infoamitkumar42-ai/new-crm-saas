const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

const TEAM = 'GJ01TEAMFIRE';
const CSV_FILE = 'CHIRAG_TEAM_POST_DEACTIVATION_AUDIT.csv';

(async () => {
    console.log(`=== 🕵️ FULL PAYMENT AUDIT: CHIRAG'S TEAM (${TEAM}) ===`);

    // 1. Get all users in Chirag's Team
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, plan_name, is_active, total_leads_promised, total_leads_received')
        .eq('team_code', TEAM);

    if (error) { console.error('Error fetching users:', error); return; }

    console.log(`Analyzing ${users.length} members...`);

    const headers = ['Name,Email,Plan,Status,Type,Total_Paid_Amount,Last_Payment_Date,Promised_Leads,Received_Leads,Pending_Quota'];
    const rows = [];

    let paidCount = 0;
    let manualCount = 0;

    for (const user of users) {
        // 2. Fetch all captured payments for this user
        const { data: payments, error: payError } = await supabase
            .from('payments')
            .select('amount, created_at')
            .eq('user_id', user.id)
            .eq('status', 'captured')
            .order('created_at', { ascending: false });

        let totalAmount = 0;
        let lastPayDate = 'N/A';
        let type = 'Manual';

        if (payments && payments.length > 0) {
            type = 'Paid';
            paidCount++;
            lastPayDate = new Date(payments[0].created_at).toLocaleDateString();
            totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
        } else {
            manualCount++;
        }

        const promised = user.total_leads_promised || 0;
        const received = user.total_leads_received || 0;
        const pending = Math.max(0, promised - received);
        const status = user.is_active ? 'Active' : 'Inactive';

        rows.push(`"${user.name}","${user.email}",${user.plan_name},${status},${type},₹${totalAmount.toFixed(2)},${lastPayDate},${promised},${received},${pending}`);
    }

    const csvContent = headers.concat(rows).join('\n');
    fs.writeFileSync(CSV_FILE, csvContent);
    console.log(`\n✅ Full Audit Report saved to ${CSV_FILE}`);

    console.log(`\n--- TEAM SUMMARY ---`);
    console.log(`Total Members: ${users.length}`);
    console.log(`Paid Members (with payment records): ${paidCount}`);
    console.log(`Manual Activations (no payment records): ${manualCount}`);
    console.log(`----------------------\n`);

})();
