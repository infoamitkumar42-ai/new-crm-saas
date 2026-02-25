const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    console.log(`--- 🔋 CHIRAG TEAM CAPACITY AUDIT 🔋 ---`);

    // Fetch ALL active users in GJ01TEAMFIRE
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, plan_name, leads_today, daily_limit, daily_limit_override, total_leads_promised, total_leads_received')
        .eq('team_code', 'GJ01TEAMFIRE')
        .eq('is_active', true);

    if (error) { console.error(error); return; }

    console.log(`Total Active Members: ${users.length}\n`);

    const available = [];
    const dailyCapped = [];
    const quotaFull = [];

    users.forEach(u => {
        const limit = u.daily_limit_override || u.daily_limit || 0;
        const quota = u.total_leads_promised || 0;
        const received = u.total_leads_received || 0;

        const remainingDaily = Math.max(0, limit - u.leads_today);
        const remainingQuota = Math.max(0, quota - received);
        const isQuotaInfinite = (quota > 9000); // Just in case, though usually manual

        if (remainingQuota <= 0 && !isQuotaInfinite) {
            quotaFull.push(u);
        } else if (remainingDaily <= 0) {
            dailyCapped.push({ ...u, remainingQuota });
        } else {
            available.push({ ...u, remainingDaily, remainingQuota });
        }
    });

    // Report
    console.log(`--- ✅ AVAILABLE FOR LEADS (${available.length}) ---`);
    if (available.length > 0) {
        available.forEach(u => {
            console.log(`[${u.plan_name}] ${u.name}: Can take ${u.remainingDaily} more today (Quota Left: ${u.remainingQuota})`);
        });
    } else {
        console.log("NONE. Everyone is full.");
    }

    console.log(`\n--- 🛑 DAILY LIMIT REACHED (${dailyCapped.length}) ---`);
    dailyCapped.forEach(u => {
        console.log(`[${u.plan_name}] ${u.name}: 0 Today (Quota Left: ${u.remainingQuota})`);
    });

    console.log(`\n--- ⛔ QUOTA EXHAUSTED (${quotaFull.length}) ---`);
    quotaFull.forEach(u => {
        console.log(`[${u.plan_name}] ${u.name}: Received ${u.total_leads_received}/${u.total_leads_promised}`);
    });

})();
