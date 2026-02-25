const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    console.log(`--- 💎 HIMANSHU VIP CAPACITY AUDIT 💎 ---`);

    // Fetch active users in TEAMFIRE
    // Plans: 'weekly_boost', 'turbo_boost', 'manager', 'supervisor'
    // Plan names might be loose, so we'll fetch all and filter.

    // We also check TEAMSIMRAN just in case, as per previous logic.
    // The user said "Himanshu's team", usually TEAMFIRE. But leads go to both.
    // Let's stick to TEAMFIRE for now unless capacity is low.

    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, team_code, plan_name, leads_today, daily_limit, daily_limit_override, total_leads_promised, total_leads_received')
        .in('team_code', ['TEAMFIRE'])
        .eq('is_active', true);

    if (error) { console.error(error); return; }

    const targetPlans = ['weekly_boost', 'turbo_boost', 'manager', 'supervisor'];

    const candidates = users.filter(u => {
        let plan = (u.plan_name || '').toLowerCase();
        // Normalize
        if (plan.includes('weekly')) plan = 'weekly_boost';
        if (plan.includes('turbo')) plan = 'turbo_boost';

        // Exact match check
        const isTarget = targetPlans.some(p => plan.includes(p));
        return isTarget;
    });

    console.log(`Found ${candidates.length} VIP Users in TEAMFIRE.`);

    const available = [];
    let totalCapacity = 0;

    candidates.forEach(u => {
        const limit = u.daily_limit_override || u.daily_limit || 0;
        const quota = u.total_leads_promised || 0;
        const received = u.total_leads_received || 0;

        const remainingDaily = Math.max(0, limit - u.leads_today);
        const remainingQuota = Math.max(0, quota - received);

        const canTake = Math.min(remainingDaily, remainingQuota); // constrained by both

        if (canTake > 0) {
            available.push({ ...u, canTake });
            totalCapacity += canTake;
        } else {
            // log why full
        }
    });

    // Sort by plan/capacity
    available.sort((a, b) => b.canTake - a.canTake);

    console.log(`\n--- AVAILABLE CAPACITY (${available.length}) ---`);
    available.forEach(u => {
        console.log(`[${u.plan_name}] ${u.name}: Can take +${u.canTake} (L:${u.leads_today}/${u.daily_limit_override || u.daily_limit}, Q:${u.total_leads_received}/${u.total_leads_promised})`);
    });

    console.log(`\n💎 TOTAL VIP CAPACITY TODAY: ${totalCapacity} Leads`);
    console.log(`🔥 ORPHAN STOCK: ~255 Leads`);

    if (totalCapacity < 255) {
        console.log(`⚠️ WARNING: Shortfall of ${255 - totalCapacity} leads capacity.`);
    } else {
        console.log(`✅ Sufficient capacity to clear orphan pool.`);
    }

})();
