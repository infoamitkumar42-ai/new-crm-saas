
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const WHITELIST = [
    'sakshidigra24@gmail.com',
    'dbrar8826@gmail.com',
    'ajayk783382@gmail.com',
    'sharmahimanshu9797@gmail.com', // Admin?
    'coach.himanshusharma@gmail.com' // Admin?
];

async function finalCleanup() {
    console.log("🧹 FINAL CLEANUP: Stopping Freeloaders & Expired Users...");

    // 1. Fetch Users in Himanshu Team
    const { data: users } = await supabase.from('users')
        .select('id, name, email, plan_name, is_active')
        .eq('team_code', 'TEAMFIRE')
        .eq('is_active', true);

    const { data: allPayments } = await supabase.from('payments')
        .select('amount, user_id, raw_payload')
        .eq('status', 'captured');

    let stopCount = 0;
    const stoppedList = [];

    for (const u of users) {
        // Skip Whitelist
        if (WHITELIST.includes(u.email?.toLowerCase())) continue;

        // Calculate Quota
        const userPays = allPayments.filter(p => {
            if (p.user_id === u.id) return true;
            const payEmail = p.raw_payload?.email || p.raw_payload?.notes?.email;
            return payEmail && payEmail.toLowerCase() === u.email?.toLowerCase();
        });

        let totalQuota = 0;
        userPays.forEach(p => {
            const amt = p.amount.toString();
            if (amt === '1999') {
                totalQuota += p.raw_payload?.description?.toLowerCase().includes('weekly') ? 92 : 115;
            } else if (amt === '999') totalQuota += 55;
            else if (amt === '2499') totalQuota += 108;
            else if (amt === '2999') totalQuota += 176;
            else if (amt > 0) totalQuota += 50;
        });
        if (totalQuota > 0) totalQuota += 5; // Welcome

        // Get Leads Used
        const { count: used } = await supabase.from('leads')
            .select('id', { count: 'exact', head: true })
            .eq('assigned_to', u.id);

        // STOP LOGIC: No Payment OR Quota Finished
        if (totalQuota === 0 || (totalQuota > 0 && used >= totalQuota)) {
            // STOP THEM!
            const { error } = await supabase.from('users')
                .update({ is_active: false })
                .eq('id', u.id);

            if (!error) {
                stopCount++;
                stoppedList.push({ Name: u.name, Email: u.email, Quota: totalQuota, Used: used });
            }
        }
    }

    console.log(`\n✅ CLEANUP COMPLETE. Stopped ${stopCount} users.`);
    if (stoppedList.length > 0) {
        console.log("\n🛑 DEACTIVATED USERS:");
        console.table(stoppedList);
    }
}

finalCleanup();
