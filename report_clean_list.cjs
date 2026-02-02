const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function generateCleanTable() {
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, name, plan_name, total_leads_received, total_leads_promised, created_at, is_active, leads_today, daily_limit')
        .order('name', { ascending: true }); // Alphabetical Order

    if (userError) return console.log(userError.message);

    const { data: payments, error: payError } = await supabase
        .from('payments')
        .select('user_id, amount, created_at')
        .eq('status', 'captured')
        .order('created_at', { ascending: true });

    if (payError) return console.log(payError.message);

    const paidUsersMap = new Map();
    payments.forEach(p => {
        if (!paidUsersMap.has(p.user_id)) paidUsersMap.set(p.user_id, []);
        paidUsersMap.get(p.user_id).push(p);
    });

    // Header
    console.log(`\n\n`);
    console.log(`| #  | Name                 | Plan         | Leads (Rec/Tot) | Today's Leads | Total Paid | Payments Count | Last Pay Date          |`);
    console.log(`|----|----------------------|--------------|------------------|---------------|------------|----------------|------------------------|`);

    let count = 0;

    users.forEach(u => {
        const userPayments = paidUsersMap.get(u.id) || [];

        // Include if they have payments OR active plan
        if (userPayments.length > 0 || (u.plan_name && u.plan_name !== 'none')) {
            count++;

            const totalPaid = userPayments.reduce((sum, p) => sum + p.amount, 0);
            const payCount = userPayments.length;
            const lastPay = userPayments.length > 0 ? new Date(userPayments[userPayments.length - 1].created_at).toLocaleDateString() : 'Manual';

            const leadsStr = `${u.total_leads_received}/${u.total_leads_promised}`;
            const todayStr = `${u.leads_today}/${u.daily_limit}`;

            console.log(`| ${String(count).padEnd(2)} | ${u.name.padEnd(20)} | ${u.plan_name.padEnd(12)} | ${leadsStr.padEnd(16)} | ${todayStr.padEnd(13)} | ₹${String(totalPaid).padEnd(9)} | ${String(payCount).padEnd(14)} | ${lastPay.padEnd(22)} |`);
        }
    });

    console.log(`\n Total Users: ${count}\n`);
}

generateCleanTable();
