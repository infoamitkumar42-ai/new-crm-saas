const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    console.log(`--- 💎 DISTRIBUTING HIMANSHU ORPHANS TO VIPs 💎 ---`);

    // 1. Identify Eligible VIPs in TEAMFIRE
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, plan_name, role, leads_today, daily_limit, daily_limit_override, total_leads_promised, total_leads_received')
        .eq('team_code', 'TEAMFIRE')
        .eq('is_active', true);

    if (error) { console.error(error); return; }

    const targetPlans = ['weekly_boost', 'turbo_boost', 'manager', 'supervisor'];

    // Filter initially
    const candidates = users.filter(u => {
        let plan = (u.plan_name || '').toLowerCase();
        if (plan.includes('weekly')) plan = 'weekly_boost';
        if (plan.includes('turbo')) plan = 'turbo_boost';

        const isTarget = targetPlans.some(p => plan.includes(p));

        // Exclude full
        const limit = u.daily_limit_override || u.daily_limit || 0;
        const quota = u.total_leads_promised || 0;
        const received = u.total_leads_received || 0;

        const remainingDaily = Math.max(0, limit - u.leads_today);
        const remainingQuota = Math.max(0, quota - received);

        return isTarget && remainingDaily > 0 && remainingQuota > 0;
    });

    console.log(`Found ${candidates.length} eligible VIP Users.`);
    if (candidates.length === 0) {
        console.log("❌ No eligible VIPs found.");
        return;
    }

    // 2. Fetch Himanshu's Orphans
    // Source: Digital Skills India / Himanshu Sharma (as per audit)
    // We fetch ALL matching orphans sorted by creation (First In, First Out)
    const START_TIME_ISO = '2026-02-18T18:30:00.000Z'; // Today

    const { data: orphans } = await supabase
        .from('leads')
        .select('id, name')
        .eq('status', 'Orphan')
        .or('source.ilike.%Himanshu%,source.ilike.%Digital Skills%')
        .gte('created_at', START_TIME_ISO)
        .order('created_at', { ascending: true }) // Oldest first
        .limit(300); // Cover the 255

    if (!orphans || orphans.length === 0) {
        console.log("No orphans found to distribute.");
        return;
    }

    console.log(`Found ${orphans.length} orphans to distribute.`);

    // 3. Distribute Round Robin
    let assignedCount = 0;

    for (let i = 0; i < orphans.length; i++) {
        const lead = orphans[i];

        // Re-calculate eligibility inside loop
        const eligibleNow = candidates.filter(u => {
            const limit = u.daily_limit_override || u.daily_limit || 0;
            const quota = u.total_leads_promised || 0;
            const received = u.total_leads_received || 0;

            const remainingDaily = Math.max(0, limit - u.leads_today);
            const remainingQuota = Math.max(0, quota - received);

            return remainingDaily > 0 && remainingQuota > 0;
        });

        if (eligibleNow.length === 0) {
            console.log("⛔ All candidates hit daily limit/quota! Stopping.");
            break;
        }

        const user = eligibleNow[i % eligibleNow.length];

        // Log sparingly
        if (i % 10 === 0) console.log(`Assigning Lead ${i + 1}/${orphans.length}: ${lead.name} -> ${user.name}`);

        const { error: updateError } = await supabase
            .from('leads')
            .update({
                status: 'Assigned',
                assigned_to: user.id,
                user_id: user.id,
                assigned_at: new Date().toISOString(),
                notes: 'Manual Distribution (Himanshu VIPs) - 2026-02-19'
            })
            .eq('id', lead.id);

        if (updateError) {
            console.error(`Failed to assign ${lead.id}:`, updateError.message);
        } else {
            assignedCount++;

            // Local Update
            user.leads_today++;
            user.total_leads_received = (user.total_leads_received || 0) + 1;

            // DB Update (Optimized - fire and forget mostly, but we await for safety in this strict loop)
            const { error: rpcError } = await supabase.rpc('increment_leads_today_safe', { user_id: user.id });
            if (rpcError) {
                // Fallback manual
                const { data: u } = await supabase.from('users').select('leads_today, total_leads_received').eq('id', user.id).single();
                if (u) {
                    await supabase.from('users').update({
                        leads_today: (u.leads_today || 0) + 1,
                        total_leads_received: (u.total_leads_received || 0) + 1
                    }).eq('id', user.id);
                }
            }
        }
    }

    console.log(`\n✅ OPERATION COMPLETE. Distributed ${assignedCount} leads.`);

})();
