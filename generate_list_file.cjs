const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function generateCleanTable() {
    console.log("Fetching users...");
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, name, plan_name, total_leads_received, total_leads_promised, created_at, is_active, leads_today, daily_limit')
        .order('name', { ascending: true });

    if (userError) return console.log("User Error: " + userError.message);

    console.log("Fetching payments...");
    const { data: payments, error: payError } = await supabase
        .from('payments')
        .select('user_id, amount, created_at')
        .eq('status', 'captured')
        .order('created_at', { ascending: true });

    if (payError) return console.log("Payment Error: " + payError.message);

    const paidUsersMap = new Map();
    payments.forEach(p => {
        if (!paidUsersMap.has(p.user_id)) paidUsersMap.set(p.user_id, []);
        paidUsersMap.get(p.user_id).push(p);
    });

    let output = '';
    output += `| #  | Name                 | Plan         | Leads (Rec/Tot) | Today's Leads | Total Paid | Pay Count | Last Pay Date          |\n`;
    output += `|----|----------------------|--------------|-----------------|---------------|------------|-----------|------------------------|\n`;

    let count = 0;

    users.forEach(u => {
        const userPayments = paidUsersMap.get(u.id) || [];

        if (userPayments.length > 0 || (u.plan_name && u.plan_name !== 'none')) {
            count++;

            const totalPaid = userPayments.reduce((sum, p) => sum + p.amount, 0);
            const payCount = userPayments.length;
            const lastPay = userPayments.length > 0 ? new Date(userPayments[userPayments.length - 1].created_at).toLocaleDateString() : 'Manual';

            const leadsStr = `${u.total_leads_received || 0}/${u.total_leads_promised || 0}`;
            const todayStr = `${u.leads_today || 0}/${u.daily_limit || 0}`;

            output += `| ${String(count).padEnd(2)} | ${u.name ? u.name.padEnd(20) : 'Unknown             '} | ${(u.plan_name || 'none').padEnd(12)} | ${leadsStr.padEnd(15)} | ${todayStr.padEnd(13)} | ₹${String(totalPaid).padEnd(9)} | ${String(payCount).padEnd(9)} | ${lastPay.padEnd(22)} |\n`;
        }
    });

    output += `\nTotal Users: ${count}\n`;

    fs.writeFileSync(path.join(__dirname, 'paid_users_list_clean.txt'), output, 'utf8');
    console.log("File written successfully: paid_users_list_clean.txt");
}

generateCleanTable();
